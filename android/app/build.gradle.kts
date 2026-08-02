import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// ─────────────────────────────────────────────────────────────
//  Firma de release
//  Las credenciales se leen de android/key.properties, que NO
//  está en git (ver .gitignore). Si el archivo no existe, el
//  build de release simplemente queda sin firmar en vez de
//  fallar, para que ./gradlew assembleDebug siga funcionando.
// ─────────────────────────────────────────────────────────────
val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = Properties().apply {
    if (keystorePropertiesFile.exists()) {
        keystorePropertiesFile.inputStream().use { load(it) }
    }
}
val hayFirma = keystoreProperties.getProperty("storeFile") != null

android {
    namespace = "com.medishort360.enfermeria"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.medishort360.enfermeria"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"
        resourceConfigurations += listOf("es", "en")
    }

    signingConfigs {
        if (hayFirma) {
            create("release") {
                storeFile = rootProject.file(keystoreProperties.getProperty("storeFile"))
                storePassword = keystoreProperties.getProperty("storePassword")
                keyAlias = keystoreProperties.getProperty("keyAlias")
                keyPassword = keystoreProperties.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            if (hayFirma) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    // Los assets web se copian desde la raíz del repo en cada build,
    // así el sitio PWA y la app comparten una única fuente de verdad.
    sourceSets["main"].assets.srcDir(layout.buildDirectory.dir("generated/webAssets"))

    packaging {
        resources.excludes += setOf("META-INF/*.kotlin_module")
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.webkit:webkit:1.12.1")
}

// ─────────────────────────────────────────────────────────────
//  Copia de la PWA a assets/
// ─────────────────────────────────────────────────────────────
val webRoot = rootProject.file("..")

val copiarAssetsWeb by tasks.registering(Copy::class) {
    description = "Copia los archivos de la PWA a los assets de la app"
    from(webRoot) {
        include(
            "index.html", "menu.css", "menu.js", "manifest.json",
            "icons/**", "fonts/**",
            "porcentaje/**", "dosisflujo/**", "aspa/**", "uci/**",
            "privacidad/**", "terminos/**"
        )
        // El service worker no aplica dentro de la app: el contenido ya
        // viaja empaquetado y se sirve local. Tampoco los placeholders de git.
        exclude("**/sw.js", "**/.gitkeep")
    }
    into(layout.buildDirectory.dir("generated/webAssets"))
}

tasks.named("preBuild") {
    dependsOn(copiarAssetsWeb)
}
