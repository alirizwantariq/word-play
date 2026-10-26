import Foundation
import CoreGraphics
import ImageIO

// Counts very light (pastel tile) pixels
let sRGB = CGColorSpace(name: CGColorSpace.sRGB)!
let path = CommandLine.arguments[1]
guard let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: path) as CFURL, nil),
      let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { fatalError("load failed") }
let w = img.width, h = img.height
guard let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8,
                         bytesPerRow: w * 4, space: sRGB,
                         bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { fatalError("ctx") }
ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
guard let data = ctx.data else { fatalError("data") }
let p = data.bindMemory(to: UInt8.self, capacity: w * h * 4)

var light = 0
var firstY = -1
for y in 0..<h {
    for x in 0..<w {
        let i = (y * w + x) * 4
        let r = Int(p[i]), g = Int(p[i+1]), b = Int(p[i+2])
        if r > 225 && g > 225 && b > 225 { light += 1; if firstY < 0 { firstY = y } }
    }
}
print("pastel pixels: \(light) firstY=\(firstY)")