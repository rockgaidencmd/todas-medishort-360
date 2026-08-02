package com.medishort360.enfermeria

import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import androidx.webkit.WebViewAssetLoader

/**
 * Contenedor de la PWA MS360 Enfermería.
 *
 * El contenido web vive en assets/ y se sirve a través de [WebViewAssetLoader],
 * que lo entrega bajo un origen https local interceptado en el proceso. Eso da
 * un contexto seguro (localStorage, iframes entre páginas) sin tocar la red:
 * la app no declara el permiso INTERNET.
 */
class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val assetLoader = WebViewAssetLoader.Builder()
            .setDomain(DOMINIO)
            .addPathHandler("/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(FONDO)

            settings.javaScriptEnabled = true
            // localStorage: guarda que el disclaimer ya fue aceptado.
            settings.domStorageEnabled = true
            // Todo se sirve por el asset loader; no hace falta acceso a ficheros.
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            settings.mediaPlaybackRequiresUserGesture = true

            // Sin un WebChromeClient, el WebView descarta window.alert() en
            // silencio. Las calculadoras lo usan para avisar de datos
            // inválidos y para el "Acerca de", así que sin esto la app
            // parecería no responder. La implementación por defecto ya
            // muestra los diálogos nativos.
            webChromeClient = WebChromeClient()

            webViewClient = object : WebViewClient() {

                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest
                ): WebResourceResponse? = assetLoader.shouldInterceptRequest(request.url)

                override fun shouldOverrideUrlLoading(
                    view: WebView,
                    request: WebResourceRequest
                ): Boolean {
                    val url = request.url
                    // Contenido propio: lo carga el WebView.
                    if (url.host.equals(DOMINIO, ignoreCase = true)) return false
                    // Cualquier otra cosa (mailto:, la política de Google) se
                    // delega al sistema; la app no navega fuera de sí misma.
                    abrirFuera(url)
                    return true
                }
            }
        }

        setContentView(webView)
        aplicarInsets()

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() = manejarAtras()
        })

        if (savedInstanceState == null) {
            webView.loadUrl("https://$DOMINIO/index.html")
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    /**
     * Desde Android 15 las apps que apuntan a API 35+ se dibujan de borde a
     * borde. Se traslada el inset a padding para que el contenido web no
     * quede debajo de la barra de estado ni de la de navegación.
     */
    private fun aplicarInsets() {
        ViewCompat.setOnApplyWindowInsetsListener(webView) { vista, insets ->
            val barras = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.ime()
            )
            vista.updatePadding(barras.left, barras.top, barras.right, barras.bottom)
            insets
        }
    }

    /**
     * El menú expone `MS360_volverAtras()`: si hay una calculadora abierta la
     * cierra y devuelve true. Si no hay nada que cerrar, se sale de la app.
     */
    private fun manejarAtras() {
        webView.evaluateJavascript(
            "(function(){return typeof window.MS360_volverAtras==='function'" +
                " ? window.MS360_volverAtras() : false;})()"
        ) { resultado ->
            if (resultado != "true") {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        }
    }

    private fun abrirFuera(url: Uri) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, url).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        } catch (e: ActivityNotFoundException) {
            // Sin app capaz de abrirlo (p. ej. no hay cliente de correo):
            // se ignora en vez de romper la navegación.
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    private companion object {
        /** Dominio reservado por androidx.webkit para servir assets locales. */
        const val DOMINIO = "appassets.androidplatform.net"
        const val FONDO = 0xFF0A0F1D.toInt()
    }
}
