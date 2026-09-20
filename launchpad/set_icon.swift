import AppKit
import Foundation

let appPath = "/Users/runting/Downloads/reference/本地工具/拾图/launchpad/拾图.app"
let imagePath = "/Users/runting/Downloads/reference/本地工具/拾图/launchpad/拾图猫咪.png"
guard let image = NSImage(contentsOfFile: imagePath) else { fatalError("Cannot load icon image") }
guard NSWorkspace.shared.setIcon(image, forFile: appPath, options: []) else { fatalError("NSWorkspace rejected custom icon") }
print("Set custom icon on \(appPath)")
