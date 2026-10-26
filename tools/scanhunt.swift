import Foundation
import CoreGraphics
import ImageIO

// Scans for (a) bright letter pixels and (b) green-tinted cell pixels
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

var green = 0, bright = 0
var greenRows = [Int: Int](), brightRows = [Int: Int]()
for y in 0..<h {
    for x in 0..<w {
        let i = (y * w + x) * 4
        let r = Int(p[i]), g = Int(p[i+1]), b = Int(p[i+2])
        if g > r + 12 && g > 55 && g > b - 8 && b > r { green += 1; greenRows[y/50] = (greenRows[y/50] ?? 0) + 1 }
        if r > 160 && g > 160 && b > 160 { bright += 1; brightRows[y/50] = (brightRows[y/50] ?? 0) + 1 }
    }
}
print("green-ish: \(green)")
print("bright letters: \(bright)")
print("bright rows (y/50 -> count): \(brightRows.sorted { $0.key < $1.key }.prefix(12))")