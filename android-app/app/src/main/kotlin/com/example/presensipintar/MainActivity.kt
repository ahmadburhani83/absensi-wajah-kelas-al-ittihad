package com.example.presensipintar

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.example.presensipintar.ui.theme.PresensiPintarTheme

enum class AppScreen {
    DASHBOARD,
    WEBVIEW
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            PresensiPintarTheme {
                MainApp()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainApp() {
    val context = LocalContext.current
    val sharedPrefs = remember {
        context.getSharedPreferences("PresensiPintarPrefs", Context.MODE_PRIVATE)
    }

    // Default to user's live Vercel deployment
    val defaultUrl = "https://absensi-wajah-kelas-al-ittihad.vercel.app"
    var serverBaseUrl by remember {
        mutableStateOf(sharedPrefs.getString("server_url", defaultUrl) ?: defaultUrl)
    }

    var currentScreen by remember { mutableStateOf(AppScreen.DASHBOARD) }
    var currentTargetUrl by remember { mutableStateOf(defaultUrl) }
    var currentTitle by remember { mutableStateOf("Presensi Pintar") }
    var webViewInstance by remember { mutableStateOf<WebView?>(null) }
    var isLoadingWeb by remember { mutableStateOf(false) }

    // Settings Dialog State
    var showSettingsDialog by remember { mutableStateOf(false) }
    var tempUrlInput by remember { mutableStateOf(serverBaseUrl) }

    // Camera Permission Launcher
    var pendingUrlToOpen by remember { mutableStateOf<String?>(null) }
    var pendingTitleToOpen by remember { mutableStateOf<String?>(null) }

    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            val url = pendingUrlToOpen ?: serverBaseUrl
            val title = pendingTitleToOpen ?: "Scan Kelas Absen"
            currentTargetUrl = url
            currentTitle = title
            currentScreen = AppScreen.WEBVIEW
            webViewInstance?.loadUrl(url)
        } else {
            Toast.makeText(
                context,
                "Izin kamera wajib diizinkan agar scanner wajah dapat berfungsi!",
                Toast.LENGTH_LONG
            ).show()
        }
    }

    fun openWithCameraPermission(url: String, title: String) {
        val hasCameraPermission = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED

        if (hasCameraPermission) {
            currentTargetUrl = url
            currentTitle = title
            currentScreen = AppScreen.WEBVIEW
            webViewInstance?.loadUrl(url)
        } else {
            pendingUrlToOpen = url
            pendingTitleToOpen = title
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    fun openUrlDirectly(url: String, title: String) {
        currentTargetUrl = url
        currentTitle = title
        currentScreen = AppScreen.WEBVIEW
        webViewInstance?.loadUrl(url)
    }

    // Handle Back Press
    BackHandler(enabled = currentScreen == AppScreen.WEBVIEW) {
        if (webViewInstance?.canGoBack() == true) {
            webViewInstance?.goBack()
        } else {
            currentScreen = AppScreen.DASHBOARD
        }
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        when (currentScreen) {
            AppScreen.DASHBOARD -> {
                TeacherDashboard(
                    serverUrl = serverBaseUrl,
                    onOpenScan = {
                        val url = "${serverBaseUrl.trimEnd('/')}/?tab=scanner#scan"
                        openWithCameraPermission(url, "Scan Presensi Kelas")
                    },
                    onOpenRekap = {
                        val url = "${serverBaseUrl.trimEnd('/')}/?tab=rekap#rekap"
                        openUrlDirectly(url, "Rekap Absensi Siswa")
                    },
                    onOpenDashboard = {
                        openUrlDirectly(serverBaseUrl, "Dashboard Presensi")
                    },
                    onOpenSettings = {
                        tempUrlInput = serverBaseUrl
                        showSettingsDialog = true
                    }
                )
            }
            AppScreen.WEBVIEW -> {
                Scaffold(
                    topBar = {
                        TopAppBar(
                            title = {
                                Column {
                                    Text(
                                        text = currentTitle,
                                        style = MaterialTheme.typography.titleMedium.copy(
                                            fontWeight = FontWeight.Bold
                                        )
                                    )
                                    Text(
                                        text = if (isLoadingWeb) "Memuat halaman..." else "Al-Ittihad • Live Cloud",
                                        style = MaterialTheme.typography.bodySmall.copy(
                                            color = if (isLoadingWeb) Color(0xFFF59E0B) else Color(0xFF10B981)
                                        )
                                    )
                                }
                            },
                            navigationIcon = {
                                IconButton(onClick = { currentScreen = AppScreen.DASHBOARD }) {
                                    Icon(
                                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                        contentDescription = "Kembali ke Beranda"
                                    )
                                }
                            },
                            actions = {
                                IconButton(onClick = { webViewInstance?.reload() }) {
                                    Icon(
                                        imageVector = Icons.Default.Refresh,
                                        contentDescription = "Muat Ulang"
                                    )
                                }
                            },
                            colors = TopAppBarDefaults.topAppBarColors(
                                containerColor = Color(0xFF0F172A),
                                titleContentColor = Color.White,
                                navigationIconContentColor = Color.White,
                                actionIconContentColor = Color.White
                            )
                        )
                    },
                    bottomBar = {
                        NavigationBar(
                            containerColor = Color(0xFF0F172A),
                            contentColor = Color.White
                        ) {
                            NavigationBarItem(
                                selected = false,
                                onClick = { currentScreen = AppScreen.DASHBOARD },
                                icon = { Icon(Icons.Default.Home, contentDescription = "Beranda") },
                                label = { Text("Beranda", fontSize = 11.sp) },
                                colors = NavigationBarItemDefaults.colors(
                                    unselectedIconColor = Color(0xFF94A3B8),
                                    unselectedTextColor = Color(0xFF94A3B8)
                                )
                            )
                            NavigationBarItem(
                                selected = currentTargetUrl.contains("scanner"),
                                onClick = {
                                    val url = "${serverBaseUrl.trimEnd('/')}/?tab=scanner#scan"
                                    openWithCameraPermission(url, "Scan Presensi Kelas")
                                },
                                icon = { Icon(Icons.Default.Face, contentDescription = "Scan") },
                                label = { Text("Scan Absen", fontSize = 11.sp) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Color(0xFF10B981),
                                    selectedTextColor = Color(0xFF10B981),
                                    unselectedIconColor = Color(0xFF94A3B8),
                                    unselectedTextColor = Color(0xFF94A3B8),
                                    indicatorColor = Color(0xFF064E3B)
                                )
                            )
                            NavigationBarItem(
                                selected = currentTargetUrl.contains("rekap"),
                                onClick = {
                                    val url = "${serverBaseUrl.trimEnd('/')}/?tab=rekap#rekap"
                                    openUrlDirectly(url, "Rekap Absensi Siswa")
                                },
                                icon = { Icon(Icons.Default.DateRange, contentDescription = "Rekap") },
                                label = { Text("Rekap Nilai", fontSize = 11.sp) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Color(0xFF6366F1),
                                    selectedTextColor = Color(0xFF6366F1),
                                    unselectedIconColor = Color(0xFF94A3B8),
                                    unselectedTextColor = Color(0xFF94A3B8),
                                    indicatorColor = Color(0xFF312E81)
                                )
                            )
                            NavigationBarItem(
                                selected = false,
                                onClick = { webViewInstance?.reload() },
                                icon = { Icon(Icons.Default.Refresh, contentDescription = "Reload") },
                                label = { Text("Refresh", fontSize = 11.sp) },
                                colors = NavigationBarItemDefaults.colors(
                                    unselectedIconColor = Color(0xFF94A3B8),
                                    unselectedTextColor = Color(0xFF94A3B8)
                                )
                            )
                        }
                    }
                ) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        AttendanceWebView(
                            url = currentTargetUrl,
                            onLoadingChanged = { isLoadingWeb = it },
                            onWebViewCreated = { webViewInstance = it }
                        )

                        if (isLoadingWeb) {
                            LinearProgressIndicator(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .align(Alignment.TopCenter),
                                color = Color(0xFF10B981)
                            )
                        }
                    }
                }
            }
        }

        // Settings Dialog
        if (showSettingsDialog) {
            AlertDialog(
                onDismissRequest = { showSettingsDialog = false },
                title = { Text("Pengaturan Server Presensi") },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            text = "Masukkan alamat URL sistem presensi (Vercel atau Local):",
                            style = MaterialTheme.typography.bodyMedium
                        )
                        OutlinedTextField(
                            value = tempUrlInput,
                            onValueChange = { tempUrlInput = it },
                            label = { Text("Alamat Server URL") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            OutlinedButton(
                                onClick = { tempUrlInput = defaultUrl },
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("Vercel", fontSize = 12.sp)
                            }
                            OutlinedButton(
                                onClick = { tempUrlInput = "file:///android_asset/www/index.html" },
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("Offline", fontSize = 12.sp)
                            }
                        }
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            val cleanUrl = tempUrlInput.trim()
                            serverBaseUrl = cleanUrl
                            sharedPrefs.edit().putString("server_url", cleanUrl).apply()
                            showSettingsDialog = false
                            Toast.makeText(context, "URL berhasil diperbarui", Toast.LENGTH_SHORT).show()
                        }
                    ) {
                        Text("Simpan")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showSettingsDialog = false }) {
                        Text("Batal")
                    }
                }
            )
        }
    }
}

@Composable
fun TeacherDashboard(
    serverUrl: String,
    onOpenScan: () -> Unit,
    onOpenRekap: () -> Unit,
    onOpenDashboard: () -> Unit,
    onOpenSettings: () -> Unit
) {
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A))
            .verticalScroll(scrollState)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        Spacer(modifier = Modifier.height(24.dp))

        // Header Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
            elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.linearGradient(
                            listOf(Color(0xFF1E293B), Color(0xFF0F172A))
                        )
                    )
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0xFF10B981).copy(alpha = 0.15f),
                    modifier = Modifier.size(64.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Default.Face,
                            contentDescription = "Logo",
                            tint = Color(0xFF10B981),
                            modifier = Modifier.size(36.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = "PRESENSI PINTAR",
                    style = MaterialTheme.typography.headlineSmall.copy(
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White,
                        letterSpacing = 1.sp
                    )
                )

                Text(
                    text = "Sekolah Islam Al-Ittihad",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = Color(0xFF94A3B8),
                        fontWeight = FontWeight.Medium
                    )
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Server Status Badge
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = Color(0xFF064E3B).copy(alpha = 0.5f),
                    border = CardDefaults.outlinedCardBorder()
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(Color(0xFF10B981))
                        )
                        Text(
                            text = "Cloud Vercel & Supabase Aktif",
                            fontSize = 12.sp,
                            color = Color(0xFFA7F3D0),
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
        }

        Text(
            text = "MENU UTAMA GURU",
            style = MaterialTheme.typography.labelMedium.copy(
                fontWeight = FontWeight.Bold,
                color = Color(0xFF64748B),
                letterSpacing = 1.5.sp
            ),
            modifier = Modifier.padding(start = 4.dp)
        )

        // CARD 1: SCAN KELAS ABSEN
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(22.dp))
                .clickable { onOpenScan() },
            shape = RoundedCornerShape(22.dp),
            colors = CardDefaults.cardColors(containerColor = Color.Transparent),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.linearGradient(
                            listOf(Color(0xFF059669), Color(0xFF047857), Color(0xFF065F46))
                        )
                    )
                    .padding(22.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = Color.White.copy(alpha = 0.2f),
                            modifier = Modifier.size(54.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.Face,
                                    contentDescription = "Scan",
                                    tint = Color.White,
                                    modifier = Modifier.size(32.dp)
                                )
                            }
                        }

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Scan Kelas Absen",
                                style = MaterialTheme.typography.titleLarge.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            )
                            Text(
                                text = "Pindai Wajah Siswa Otomatis",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    color = Color(0xFFA7F3D0)
                                )
                            )
                        }
                    }

                    Text(
                        text = "Guru masuk kelas, pilih jam pelajaran & kelas, lalu scan wajah siswa langsung via kamera tanpa simpan foto.",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = Color.White.copy(alpha = 0.9f)
                        )
                    )

                    Button(
                        onClick = onOpenScan,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.White,
                            contentColor = Color(0xFF047857)
                        ),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(
                            imageVector = Icons.Default.PlayArrow,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "BUKA SCANNER KELAS",
                            fontWeight = FontWeight.ExtraBold
                        )
                    }
                }
            }
        }

        // CARD 2: REKAP ABSENSI
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(22.dp))
                .clickable { onOpenRekap() },
            shape = RoundedCornerShape(22.dp),
            colors = CardDefaults.cardColors(containerColor = Color.Transparent),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.linearGradient(
                            listOf(Color(0xFF4F46E5), Color(0xFF4338CA), Color(0xFF3730A3))
                        )
                    )
                    .padding(22.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = Color.White.copy(alpha = 0.2f),
                            modifier = Modifier.size(54.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.DateRange,
                                    contentDescription = "Rekap",
                                    tint = Color.White,
                                    modifier = Modifier.size(30.dp)
                                )
                            }
                        }

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Rekap Absensi Siswa",
                                style = MaterialTheme.typography.titleLarge.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            )
                            Text(
                                text = "Matriks Jam ke-1 s.d ke-N",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    color = Color(0xFFC7D2FE)
                                )
                            )
                        }
                    }

                    Text(
                        text = "Lihat rekapitulasi kehadiran berdasarkan kelas: Nama Siswa | Jam 1 | Jam 2 | ... | Jam N, persentase & ekspor CSV.",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = Color.White.copy(alpha = 0.9f)
                        )
                    )

                    Button(
                        onClick = onOpenRekap,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.White,
                            contentColor = Color(0xFF4338CA)
                        ),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "BUKA REKAP ABSENSI",
                            fontWeight = FontWeight.ExtraBold
                        )
                    }
                }
            }
        }

        // Secondary Actions
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedButton(
                onClick = onOpenDashboard,
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFE2E8F0)),
                modifier = Modifier.weight(1f)
            ) {
                Icon(Icons.Default.Home, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Dashboard", fontSize = 13.sp)
            }

            OutlinedButton(
                onClick = onOpenSettings,
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFF94A3B8)),
                modifier = Modifier.weight(1f)
            ) {
                Icon(Icons.Default.Settings, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Pengaturan", fontSize = 13.sp)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Versi 1.0.0 • Presensi Pintar Al-Ittihad\nBiometric Zero-Image Privacy Compliant",
            style = MaterialTheme.typography.bodySmall.copy(
                color = Color(0xFF475569),
                textAlign = TextAlign.Center
            ),
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(24.dp))
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun AttendanceWebView(
    url: String,
    onLoadingChanged: (Boolean) -> Unit,
    onWebViewCreated: (WebView) -> Unit
) {
    AndroidView(
        factory = { context ->
            WebView(context).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )

                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    databaseEnabled = true
                    allowFileAccess = true
                    allowContentAccess = true
                    mediaPlaybackRequiresUserGesture = false
                    mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                    cacheMode = WebSettings.LOAD_DEFAULT
                    useWideViewPort = true
                    loadWithOverviewMode = true
                }

                webChromeClient = object : WebChromeClient() {
                    override fun onPermissionRequest(request: PermissionRequest?) {
                        // Crucial for WebRTC Camera inside WebView!
                        request?.resources?.let { resources ->
                            request.grant(resources)
                        }
                    }
                }

                webViewClient = object : WebViewClient() {
                    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                        super.onPageStarted(view, url, favicon)
                        onLoadingChanged(true)
                    }

                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        onLoadingChanged(false)
                    }

                    override fun shouldOverrideUrlLoading(
                        view: WebView?,
                        request: WebResourceRequest?
                    ): Boolean {
                        return false // Let WebView load all URLs internally
                    }
                }

                onWebViewCreated(this)
                loadUrl(url)
            }
        },
        update = { webView ->
            if (webView.url != url) {
                webView.loadUrl(url)
            }
        },
        modifier = Modifier.fillMaxSize()
    )
}
