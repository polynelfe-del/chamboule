param(
    [string]$Output,
    [string]$SigningDirectory,
    [int]$VersionCode = 1,
    [string]$VersionName = '1.0.0'
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$work = Split-Path $repo -Parent
$workspace = Split-Path $work -Parent
$toolchain = Join-Path $work 'android-toolchain'
if (!$Output) { $Output = Join-Path $workspace 'outputs/Chamboule-Android.apk' }
if (!$SigningDirectory) { $SigningDirectory = Join-Path $work 'chamboule-signing' }
$jdk = (Get-ChildItem -Directory -LiteralPath (Join-Path $toolchain 'jdk') | Select-Object -First 1).FullName
$java = Join-Path $jdk 'bin/java.exe'
$javac = Join-Path $jdk 'bin/javac.exe'
$jar = Join-Path $jdk 'bin/jar.exe'
$keytool = Join-Path $jdk 'bin/keytool.exe'
$sdk = Join-Path $toolchain 'build-tools/android-15'
$androidJar = Join-Path $toolchain 'platform/android-35/android.jar'
$main = Join-Path $PSScriptRoot 'app/src/main'
$build = Join-Path $work ('apk-build-' + [guid]::NewGuid().ToString('N'))

function Run([string]$Program, [string[]]$Arguments) {
    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Program failed ($LASTEXITCODE)" }
}

foreach ($dir in @('assets/www','resources','classes','dex')) {
    New-Item -ItemType Directory -Path (Join-Path $build $dir) -Force | Out-Null
}
Run 'node' @((Join-Path $repo 'source/build.js'))
Run 'node' @('--test',(Join-Path $repo 'tests/native-reminders.test.js'))
Run 'node' @((Join-Path $PSScriptRoot 'package-web.js'), (Join-Path $build 'assets/www'))
Copy-Item -Path (Join-Path $main 'res/*') -Destination (Join-Path $build 'resources') -Recurse
Copy-Item -LiteralPath (Join-Path $repo 'icon-192.png') -Destination (Join-Path $build 'resources/drawable/chamboule_icon.png')

$resourceZip = Join-Path $build 'resources.zip'
$unsigned = Join-Path $build 'unsigned.apk'
$aligned = Join-Path $build 'aligned.apk'
$classJar = Join-Path $build 'classes.jar'
Run (Join-Path $sdk 'aapt2.exe') @('compile','--dir',(Join-Path $build 'resources'),'-o',$resourceZip)
Run (Join-Path $sdk 'aapt2.exe') @('link','-I',$androidJar,'--manifest',(Join-Path $main 'AndroidManifest.xml'),
    '--min-sdk-version','26','--target-sdk-version','35','--version-code',"$VersionCode",'--version-name',$VersionName,
    '-o',$unsigned,$resourceZip)
$sources = @(Get-ChildItem -File -Recurse -LiteralPath (Join-Path $main 'java') -Filter '*.java' | Select-Object -ExpandProperty FullName)
Run $javac (@('-encoding','UTF-8','--release','17','-classpath',$androidJar,'-d',(Join-Path $build 'classes')) + $sources)
Run $jar @("-J-Djava.io.tmpdir=$build",'cf',$classJar,'-C',(Join-Path $build 'classes'),'.')
Run $java @("-Djava.io.tmpdir=$build",'-cp',(Join-Path $sdk 'lib/d8.jar'),'com.android.tools.r8.D8','--lib',$androidJar,'--min-api','26',
    '--output',(Join-Path $build 'dex'),$classJar)
# Adding the assets through jar keeps ZIP names portable. AAPT2 on Windows emits backslashes for -A.
Run $jar @("-J-Djava.io.tmpdir=$build",'uf',$unsigned,'-C',(Join-Path $build 'dex'),'classes.dex','-C',$build,'assets')
$contents = [IO.Compression.ZipFile]::OpenRead($unsigned)
try {
    if (!$contents.GetEntry('assets/www/index.html') -or !$contents.GetEntry('assets/www/fonts/nunito.woff2') -or !$contents.GetEntry('classes.dex')) {
        throw 'The APK is missing its local application assets.'
    }
} finally { $contents.Dispose() }
Run (Join-Path $sdk 'zipalign.exe') @('-f','-p','4',$unsigned,$aligned)

New-Item -ItemType Directory -Path $SigningDirectory -Force | Out-Null
$keyStore = Join-Path $SigningDirectory 'chamboule.p12'
$password = Join-Path $SigningDirectory 'chamboule-password.txt'
if ((Test-Path -LiteralPath $keyStore) -and !(Test-Path -LiteralPath $password)) {
    throw 'The existing Android signing key needs its original password file.'
}
if (!(Test-Path -LiteralPath $password)) {
    $secret = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
    [IO.File]::WriteAllText($password, $secret, [Text.Encoding]::ASCII)
}
if (!(Test-Path -LiteralPath $keyStore)) {
    Run $keytool @('-genkeypair','-alias','chamboule','-keyalg','RSA','-keysize','3072','-validity','10000',
        '-storetype','PKCS12','-keystore',$keyStore,'-storepass:file',$password,'-dname','CN=Chamboule Coach')
}
New-Item -ItemType Directory -Path (Split-Path $Output -Parent) -Force | Out-Null
Run $java @('-jar',(Join-Path $sdk 'lib/apksigner.jar'),'sign','--ks',$keyStore,'--ks-key-alias','chamboule',
    '--ks-pass',"file:$password",'--min-sdk-version','26','--v4-signing-enabled','false','--out',$Output,$aligned)
Run $java @('-jar',(Join-Path $sdk 'lib/apksigner.jar'),'verify','--verbose','--print-certs',$Output)
Run (Join-Path $sdk 'zipalign.exe') @('-c','-p','4',$Output)
Get-Item -LiteralPath $Output | Select-Object Name,Length
