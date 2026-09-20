import AppKit

final class LauncherDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        let target = URL(fileURLWithPath: "/Users/runting/Library/CloudStorage/OneDrive-个人/codex/拾图/拾图.app")
        guard FileManager.default.fileExists(atPath: target.path) else {
            showError("找不到 OneDrive 中的拾图应用。请确认 OneDrive 已同步到本机。")
            return
        }
        NSWorkspace.shared.openApplication(at: target, configuration: NSWorkspace.OpenConfiguration()) { _, error in
            DispatchQueue.main.async {
                if let error { self.showError("启动拾图失败：\(error.localizedDescription)") }
                NSApp.terminate(nil)
            }
        }
    }

    private func showError(_ message: String) {
        let alert = NSAlert()
        alert.messageText = "拾图启动失败"
        alert.informativeText = message
        alert.alertStyle = .warning
        alert.runModal()
        NSApp.terminate(nil)
    }
}

let app = NSApplication.shared
let delegate = LauncherDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
