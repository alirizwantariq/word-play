import Foundation
import CoreGraphics
import ImageIO

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

var white = 0, gold = 0, total = 0
for y in 0..<h {
    for x in 0..<w {
        let i = (y * w + x) * 4
        let r = Int(p[i]), g = Int(p[i+1]), b = Int(p[i+2]), a = Int(p[i+3])
        total += 1
        if a > 200 {
            if r > 235 && g > 235 && b > 235 { white += 1 }
            if r > 240 && g > 190 && g < 230 && b < 120 { gold += 1 }
        }
    }
}
print("size=\(w)x\(h) opaque=\(total) white=\(white) gold=\(gold)")