package com.sjs.erp;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceError;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(NotificationSettingsPlugin.class);
    }

    @Override
    public void onStart() {
        super.onStart();
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            webView.setWebViewClient(new BridgeWebViewClient(this.bridge) {
                @Override
                public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                    if (request.isForMainFrame()) {
                        loadOfflineTemplate(view);
                    } else {
                        super.onReceivedError(view, request, error);
                    }
                }

                @Override
                public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                    loadOfflineTemplate(view);
                }
            });
        }
    }

    private void loadOfflineTemplate(WebView view) {
        String offlineHtml = "<!DOCTYPE html>\n" +
            "<html>\n" +
            "<head>\n" +
            "  <meta charset=\"utf-8\">\n" +
            "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no\">\n" +
            "  <title>Connection Offline</title>\n" +
            "  <link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css\">\n" +
            "  <style>\n" +
            "    body {\n" +
            "      margin: 0;\n" +
            "      padding: 0;\n" +
            "      width: 100vw;\n" +
            "      height: 100vh;\n" +
            "      display: flex;\n" +
            "      flex-direction: column;\n" +
            "      align-items: center;\n" +
            "      justify-content: center;\n" +
            "      background: linear-gradient(135deg, #fdfbf7 0%, #f8f3e7 50%, #f3ece0 100%);\n" +
            "      font-family: system-ui, -apple-system, sans-serif;\n" +
            "      color: #1e293b;\n" +
            "      overflow: hidden;\n" +
            "    }\n" +
            "    .container {\n" +
            "      display: flex;\n" +
            "      flex-direction: column;\n" +
            "      align-items: center;\n" +
            "      text-align: center;\n" +
            "      padding: 24px;\n" +
            "      z-index: 10;\n" +
            "    }\n" +
            "    .logo-orbit-container {\n" +
            "      position: relative;\n" +
            "      width: 140px;\n" +
            "      height: 140px;\n" +
            "      display: flex;\n" +
            "      align-items: center;\n" +
            "      justify-content: center;\n" +
            "      margin-bottom: 24px;\n" +
            "    }\n" +
            "    .orbit-ring {\n" +
            "      position: absolute;\n" +
            "      width: 130px;\n" +
            "      height: 130px;\n" +
            "      border: 2px dashed rgba(79, 70, 229, 0.2);\n" +
            "      border-radius: 50%;\n" +
            "      animation: rotate 15s linear infinite;\n" +
            "    }\n" +
            "    @keyframes rotate {\n" +
            "      100% { transform: rotate(360deg); }\n" +
            "    }\n" +
            "    .logo-center-circle {\n" +
            "      width: 100px;\n" +
            "      height: 100px;\n" +
            "      border-radius: 50%;\n" +
            "      background: white;\n" +
            "      display: flex;\n" +
            "      align-items: center;\n" +
            "      justify-content: center;\n" +
            "      box-shadow: 0 8px 24px rgba(0,0,0,0.06);\n" +
            "      overflow: hidden;\n" +
            "    }\n" +
            "    .logo-img {\n" +
            "      width: 75px;\n" +
            "      height: 75px;\n" +
            "      object-fit: contain;\n" +
            "    }\n" +
            "    .title {\n" +
            "      font-size: 22px;\n" +
            "      font-weight: 800;\n" +
            "      margin: 0 0 8px 0;\n" +
            "      color: #0f172a;\n" +
            "      letter-spacing: -0.02em;\n" +
            "    }\n" +
            "    .subtitle {\n" +
            "      font-size: 14px;\n" +
            "      color: #64748b;\n" +
            "      max-width: 280px;\n" +
            "      line-height: 1.5;\n" +
            "      margin: 0 0 28px 0;\n" +
            "    }\n" +
            "    .retry-btn {\n" +
            "      background: #4f46e5;\n" +
            "      color: white;\n" +
            "      border: none;\n" +
            "      padding: 14px 28px;\n" +
            "      border-radius: 14px;\n" +
            "      font-size: 15px;\n" +
            "      font-weight: 700;\n" +
            "      cursor: pointer;\n" +
            "      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);\n" +
            "      transition: all 0.2s;\n" +
            "      display: flex;\n" +
            "      align-items: center;\n" +
            "      gap: 8px;\n" +
            "    }\n" +
            "    .retry-btn:active {\n" +
            "      transform: scale(0.98);\n" +
            "      background: #4338ca;\n" +
            "    }\n" +
            "    .waves {\n" +
            "      position: absolute;\n" +
            "      bottom: 0;\n" +
            "      left: 0;\n" +
            "      width: 100%;\n" +
            "      height: 80px;\n" +
            "      fill: rgba(79, 70, 229, 0.05);\n" +
            "      z-index: 1;\n" +
            "    }\n" +
            "  </style>\n" +
            "</head>\n" +
            "<body>\n" +
            "  <div class=\"container\">\n" +
            "    <div class=\"logo-orbit-container\">\n" +
            "      <div class=\"orbit-ring\"></div>\n" +
            "      <div class=\"logo-center-circle\">\n" +
            "        <img src=\"file:///android_asset/public/assets/logo.png\" alt=\"SJS Logo\" class=\"logo-img\" onerror=\"this.src='https://res.cloudinary.com/djxy4wdub/image/upload/v1784261228/erp_gallery/dbjlpzl7p01krmv34mt5.webp';\">\n" +
            "      </div>\n" +
            "    </div>\n" +
            "    <h2 class=\"title\">Connection Offline</h2>\n" +
            "    <p class=\"subtitle\">Please check your internet connection status and try again.</p>\n" +
            "    <button class=\"retry-btn\" onclick=\"window.location.href='https://sjs-school.vercel.app/'\">\n" +
            "      <i class=\"fa-solid fa-rotate-right\"></i>\n" +
            "      Retry Connection\n" +
            "    </button>\n" +
            "  </div>\n" +
            "  <svg class=\"waves\" viewBox=\"0 0 1440 120\" preserveAspectRatio=\"none\">\n" +
            "    <path d=\"M0,32L120,42.7C240,53,480,75,720,74.7C960,75,1200,53,1320,42.7L1440,32L1440,120L1320,120C1200,120,960,120,720,120C480,120,240,120,120,120L0,120Z\"></path>\n" +
            "  </svg>\n" +
            "</body>\n" +
            "</html>";
        view.loadDataWithBaseURL("https://sjs-school.vercel.app", offlineHtml, "text/html", "UTF-8", null);
    }
}
