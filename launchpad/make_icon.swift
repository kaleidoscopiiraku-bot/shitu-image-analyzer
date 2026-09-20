import AppKit
import Foundation

let input = URL(fileURLWithPath: "/Users/runting/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/kaleidoscopiiraku_3038/temp/RWTemp/2026-09/9e20f478899dc29eb19741386f9343c8/74a352257eccb20cdff8688245fa5046.jpg")
let output = URL(fileURLWithPath: "/Users/runting/Downloads/reference/本地工具/拾图/launchpad/拾图猫咪.png")
guard let source = NSImage(contentsOf: input) else { fatalError("Cannot open source photo") }
let side = min(source.size.width, source.size.height)
let cropY = (source.size.height - side) / 2
let size = 1024
let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
guard let context = NSGraphicsContext(bitmapImageRep: rep) else { fatalError("Cannot create bitmap context") }
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = context
context.imageInterpolation = .high
context.shouldAntialias = true
let rect = NSRect(x: 0, y: 0, width: size, height: size)
NSColor.clear.setFill()
rect.fill()
NSBezierPath(roundedRect: rect, xRadius: 220, yRadius: 220).addClip()
source.draw(in: rect, from: NSRect(x: 0, y: cropY, width: side, height: side), operation: .copy, fraction: 1, respectFlipped: true, hints: [.interpolation: NSImageInterpolation.high])
context.flushGraphics()
NSGraphicsContext.restoreGraphicsState()
let data = rep.representation(using: .png, properties: [:])!
try data.write(to: output)
print("Wrote \(output.path) (\(source.size.width)x\(source.size.height) source, centered \(Int(side)) square crop)")
