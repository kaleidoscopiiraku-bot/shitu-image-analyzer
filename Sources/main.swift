import AppKit
import Foundation
import WebKit
import Carbon
import UniformTypeIdentifiers

final class App: NSObject, NSApplicationDelegate, WKScriptMessageHandler, WKNavigationDelegate {
    var window: NSWindow!
    var web: WKWebView!
    var statusItem: NSStatusItem!
    var process: Process?
    var pending: (String, String)?
    var ready = false
    var shortcut: EventHotKeyRef?
    let root = Bundle.main.resourceURL!
    let fileManager = Foundation.FileManager()
    let dataRoot = URL(fileURLWithPath: NSHomeDirectory()).appendingPathComponent("Library/Application Support/拾图")
    var token = ""
    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        buildMenu()
        NSApp.servicesProvider = self
        NSUpdateDynamicServices()
        token = Bundle.main.object(forInfoDictionaryKey:"ShituLocalToken") as? String ?? ""
        if token.isEmpty { alert("缺少本地配对配置，请重新安装拾图。"); NSApp.terminate(nil); return }
        let cfg = WKWebViewConfiguration()
        cfg.userContentController.add(self, name: "native")
        cfg.userContentController.addUserScript(WKUserScript(source: "window.__shituToken = \"\(token)\";", injectionTime: .atDocumentStart, forMainFrameOnly: true))
        web = WKWebView(frame: .zero, configuration: cfg)
        web.navigationDelegate = self
        window = NSWindow(contentRect: NSRect(x: 0,y: 0,width: 1040,height: 760), styleMask: [.titled,.closable,.miniaturizable,.resizable], backing: .buffered, defer: false)
        window.title = "拾图 · 图片分析"
        window.minSize = NSSize(width: 760,height: 500)
        window.level = .normal
        window.isReleasedWhenClosed = false
        window.collectionBehavior = [.moveToActiveSpace]
        window.contentView = web
        window.center()
        show()
        startServer()
        let signature: OSType = 0x49494D47
        var event = EventTypeSpec(eventClass: OSType(kEventClassKeyboard), eventKind: UInt32(kEventHotKeyPressed))
        InstallEventHandler(GetApplicationEventTarget(), { _, _, data in
            guard let data = data else { return noErr }
            let app = Unmanaged<App>.fromOpaque(data).takeUnretainedValue()
            DispatchQueue.main.async { app.capture() }
            return noErr
        }, 1, &event, Unmanaged.passUnretained(self).toOpaque(), nil)
        let code = RegisterEventHotKey(UInt32(kVK_ANSI_I), UInt32(controlKey | optionKey), EventHotKeyID(signature: signature,id: 1), GetApplicationEventTarget(), 0, &shortcut)
        if code != noErr { alert("快捷键 ⌃⌥I 已被占用，仍可从菜单栏选择“框选图片”。") }
    }
    func buildMenu() {
        let main = NSMenu(); let top = NSMenuItem(); main.addItem(top)
        let menu = NSMenu(); top.submenu = menu
        func add(_ title:String,_ action:Selector,_ key:String="") { let item=NSMenuItem(title:title,action:action,keyEquivalent:key);item.target=self;menu.addItem(item) }
        add("打开图片…",#selector(openFile),"o")
        add("框选图片  ⌃⌥I",#selector(capture))
        add("分析剪贴板图片",#selector(clipboard))
        add("显示拾图",#selector(show))
        menu.addItem(.separator())
        let services=NSMenu();let item=NSMenuItem(title:"服务",action:nil,keyEquivalent:"");item.submenu=services;menu.addItem(item);NSApp.servicesMenu=services
        add("退出拾图",#selector(quit),"q")
        let editTop=NSMenuItem();main.addItem(editTop);let edit=NSMenu(title:"编辑");editTop.submenu=edit
        for (title,action,key) in [("复制",#selector(NSText.copy(_:)),"c"),("粘贴",#selector(NSText.paste(_:)),"v"),("全选",#selector(NSText.selectAll(_:)),"a")] { edit.addItem(NSMenuItem(title:title,action:action,keyEquivalent:key)) }
        NSApp.mainMenu=main
        statusItem=NSStatusBar.system.statusItem(withLength:NSStatusItem.variableLength)
        statusItem.button?.image=NSImage(systemSymbolName:"viewfinder",accessibilityDescription:"拾图")
        statusItem.menu=menu
    }
    func trace(_ text: String) {
        let u=dataRoot.appendingPathComponent("logs/native.log")
        if !fileManager.fileExists(atPath:u.path) {fileManager.createFile(atPath:u.path,contents:nil)}
        if let f=try? FileHandle(forWritingTo:u){f.seekToEndOfFile();f.write((Date().description+" "+text+"\n").data(using:.utf8)!);try? f.close()}
    }
    func startServer() {
        trace("startServer")
        var req=URLRequest(url:URL(string:"http://127.0.0.1:19428/health")!);req.setValue("Bearer \(token)",forHTTPHeaderField:"Authorization");req.timeoutInterval=1
        URLSession.shared.dataTask(with:req) { [weak self] _,response,error in
            self?.trace("health: \((response as? HTTPURLResponse)?.statusCode ?? 0) error: \(error?.localizedDescription ?? "none")")
            DispatchQueue.main.async {
                guard let self=self else{return}
            if (response as? HTTPURLResponse)?.statusCode == 200 { self.loadPage(); return }
                let p=Process();p.executableURL=URL(fileURLWithPath:"/usr/bin/python3");p.arguments=[self.root.appendingPathComponent("server.py").path]
                let log=self.dataRoot.appendingPathComponent("logs/bridge.log");if !self.fileManager.fileExists(atPath:log.path){self.fileManager.createFile(atPath:log.path,contents:nil)}
                let handle=try? FileHandle(forWritingTo:log);handle?.seekToEndOfFile();p.standardOutput=handle;p.standardError=handle
                var environment=ProcessInfo.processInfo.environment
                environment["SHITU_TOKEN"]=self.token
                p.environment=environment
                do {try p.run();self.process=p;self.waitForServer(remaining:60)} catch {self.alert("无法启动本地分析服务：\(error.localizedDescription)")}
            }
        }.resume()
    }
    func waitForServer(remaining:Int) {
        var req=URLRequest(url:URL(string:"http://127.0.0.1:19428/health")!);req.setValue("Bearer \(token)",forHTTPHeaderField:"Authorization");req.timeoutInterval=1
        URLSession.shared.dataTask(with:req) { [weak self] _,response,error in
            self?.trace("health: \((response as? HTTPURLResponse)?.statusCode ?? 0) error: \(error?.localizedDescription ?? "none")")
            DispatchQueue.main.async {
                guard let self=self else{return}
                if (response as? HTTPURLResponse)?.statusCode==200 {self.loadPage()}
                else if remaining>0 {DispatchQueue.main.asyncAfter(deadline:.now()+0.5){self.waitForServer(remaining:remaining-1)}}
                else {self.alert("本地服务启动失败。请查看项目中的 logs/bridge.log。")} 
            }
        }.resume()
    }
    func loadPage(){trace("loadPage");web.load(URLRequest(url:URL(string:"http://127.0.0.1:19428/")!))}
    func webView(_ webView:WKWebView,didFinish navigation:WKNavigation!){trace("page finished");ready=true;if let pair=pending{pending=nil;send(pair.0,pair.1)}}
    func webView(_ webView:WKWebView,decidePolicyFor navigationAction:WKNavigationAction,decisionHandler:@escaping(WKNavigationActionPolicy)->Void){
        let u=navigationAction.request.url
        trace("navigation: \(u?.scheme ?? "nil") \(u?.host ?? "nil") \(u?.port ?? 0)")
        decisionHandler(u?.host=="127.0.0.1" && u?.port==19428 ? .allow : .cancel)
    }
    func webView(_ webView:WKWebView,didFailProvisionalNavigation navigation:WKNavigation!,withError error:Error){trace("navigation error: \(error.localizedDescription)");alert("页面加载失败：\(error.localizedDescription)")}
    func userContentController(_ userContentController:WKUserContentController,didReceive message:WKScriptMessage){
        guard let b=message.body as? [String:Any],let action=b["action"] as? String else{return}
        switch action {
        case "capture":capture()
        case "clipboard":clipboard()
        case "copy":if let text=b["value"] as? String{NSPasteboard.general.clearContents();NSPasteboard.general.setString(text,forType:.string)}
        case "chatgpt-web":
            guard let payload=b["value"] as? [String:Any],let image=payload["image"] as? String,let prompt=payload["prompt"] as? String,
                  let encoded=image.split(separator:",",omittingEmptySubsequences:false).last,
                  let imageData=Data(base64Encoded:String(encoded)),imageData.count<=10*1024*1024 else{alert("无法准备 ChatGPT 图片，请重新选中图片后重试。");return}
            guard let sourceImage=NSImage(data:imageData),let cg=sourceImage.cgImage(forProposedRect:nil,context:nil,hints:nil),
                  let png=NSBitmapImageRep(cgImage:cg).representation(using:.png,properties:[:]) else{alert("无法转换图片到剪贴板，请重试。");return}
            let item=NSPasteboardItem();item.setString(prompt,forType:.string);item.setData(png,forType:NSPasteboard.PasteboardType("public.png"))
            let pasteboard=NSPasteboard.general;pasteboard.clearContents()
            guard pasteboard.writeObjects([item]) else{alert("写入剪贴板失败，请重试。");return}
            // Keep the workflow in the current app: the user can paste the prepared
            // image and prompt into ChatGPT or another image-understanding tool.
        case "codex-login": launchCodexLogin()
        default:break
        }
    }
    func codexExecutable() -> String? {
        let candidates=[
            ProcessInfo.processInfo.environment["SHITU_CODEX_BIN"],
            NSHomeDirectory()+"/.local/bin/codex",
            "/opt/homebrew/bin/codex",
            "/usr/local/bin/codex"
        ].compactMap{$0}
        return candidates.first{fileManager.isExecutableFile(atPath:$0)}
    }
    func launchCodexLogin() {
        guard let url=URL(string:"https://developers.openai.com/docs/codex/cli") else{return}
        guard let binary=codexExecutable() else {NSWorkspace.shared.open(url);return}
        let script=fileManager.temporaryDirectory.appendingPathComponent("shitu-codex-login-\(UUID().uuidString).command")
        let escaped=binary.replacingOccurrences(of:"'",with:"'\\''")
        let contents="#!/bin/zsh\n\"\(escaped)\" login\nstatus=$?\necho\nif [ $status -eq 0 ]; then echo '拾图：Codex 登录完成，可以关闭此窗口。'; else echo '拾图：Codex 登录未完成，请按终端提示重试。'; fi\necho\nread -r -n 1 -s -p '按任意键关闭此窗口…'\n"
        do {
            try contents.write(to:script,atomically:true,encoding:.utf8)
            try fileManager.setAttributes([.posixPermissions:0o700],ofItemAtPath:script.path)
            let opener=Process();opener.executableURL=URL(fileURLWithPath:"/usr/bin/open");opener.arguments=["-a","Terminal",script.path];try opener.run()
        } catch { alert("无法打开 Codex 登录窗口：\(error.localizedDescription)") }
    }
    @objc func show(){window?.makeKeyAndOrderFront(nil);NSApp.activate(ignoringOtherApps:true)}
    @objc func quit(){NSApp.terminate(nil)}
    @objc func openFile(){let p=NSOpenPanel();p.allowedContentTypes=[.image];p.allowsMultipleSelection=false;if p.runModal() == .OK,let u=p.url{loadImage(u)}}
    func loadImage(_ url:URL){guard let image=NSImage(contentsOf:url) else{alert("无法打开这张图片。");return};useImage(image,name:url.lastPathComponent)}
    func useImage(_ image:NSImage,name:String){
        guard let cg=image.cgImage(forProposedRect:nil,context:nil,hints:nil) else{alert("无法解码图片。");return}
        let scale=min(1,1280.0/Double(max(cg.width,cg.height)))
        let width=max(1,Int(Double(cg.width)*scale)),height=max(1,Int(Double(cg.height)*scale))
        guard let ctx=CGContext(data:nil,width:width,height:height,bitsPerComponent:8,bytesPerRow:0,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.noneSkipLast.rawValue) else{return}
        ctx.setFillColor(NSColor.white.cgColor);ctx.fill(CGRect(x:0,y:0,width:width,height:height));ctx.interpolationQuality = .high;ctx.draw(cg,in:CGRect(x:0,y:0,width:width,height:height))
        guard let out=ctx.makeImage(),let data=NSBitmapImageRep(cgImage:out).representation(using:.jpeg,properties:[.compressionFactor:0.9]) else{return}
        let src="data:image/jpeg;base64,"+data.base64EncodedString();if ready{send(src,name)}else{pending=(src,name)};show()
    }
    func send(_ src:String,_ name:String){let args=try! JSONSerialization.data(withJSONObject:[src,name]);let json=String(data:args,encoding:.utf8)!;web.evaluateJavaScript("window.setSelectedImage(...\(json))",completionHandler:nil)}
    @objc func clipboard(){guard let image=NSImage(pasteboard:NSPasteboard.general) else{alert("剪贴板里没有图片。请先复制图片，或使用框选图片。");return};useImage(image,name:"剪贴板图片")}
    @objc func capture(){
        window.orderOut(nil)
        let url=fileManager.temporaryDirectory.appendingPathComponent("shitu-\(UUID().uuidString).png")
        DispatchQueue.main.asyncAfter(deadline:.now()+0.3){
            let p=Process();p.executableURL=URL(fileURLWithPath:"/usr/sbin/screencapture");p.arguments=["-i","-s","-x",url.path]
            p.terminationHandler={ [weak self] _ in DispatchQueue.main.async {guard let self=self else{return};defer{try? self.fileManager.removeItem(at:url)};if self.fileManager.fileExists(atPath:url.path){self.loadImage(url)}else{self.show()}} }
            do{try p.run()}catch{self.alert("无法开始框选。请在系统设置中允许拾图录制屏幕。");self.show()}
        }
    }
    @objc func analyzeService(_ pasteboard:NSPasteboard,userData:String?,error:AutoreleasingUnsafeMutablePointer<NSString>){
        if let urls=pasteboard.readObjects(forClasses:[NSURL.self],options:[.urlReadingFileURLsOnly:true]) as? [URL],let u=urls.first {loadImage(u)}
        else if let names=pasteboard.propertyList(forType:NSPasteboard.PasteboardType("NSFilenamesPboardType")) as? [String],let p=names.first{loadImage(URL(fileURLWithPath:p))}
        else if let image=NSImage(pasteboard:pasteboard){useImage(image,name:"所选图片")}
        else{error.pointee="请选择一个图片文件。"}
    }
    func application(_ sender:NSApplication,openFiles filenames:[String]){if let path=filenames.first{if web==nil{DispatchQueue.main.asyncAfter(deadline:.now()+1){self.loadImage(URL(fileURLWithPath:path))}}else{loadImage(URL(fileURLWithPath:path))}};NSApp.reply(toOpenOrPrint:.success)}
    func applicationShouldHandleReopen(_ sender:NSApplication,hasVisibleWindows flag:Bool)->Bool{show();return true}
    func applicationWillTerminate(_ notification:Notification){process?.terminate()}
    func alert(_ message:String){let a=NSAlert();a.messageText="拾图";a.informativeText=message;a.runModal()}
}
let app=NSApplication.shared
let delegate=App()
app.delegate=delegate
app.run()
