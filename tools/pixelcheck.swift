import Foundation
import CoreGraphics
import ImageIO

// Pixel sampler: prints RGB at given coordinates of a PNG
// Usage: swift pixelcheck.swift <file> <x> <y> ...

func color(at path: String, x: Int, y: Int) -> (Int, Int, Int, Int)? {
    guard let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: path) as CFURL, nil),
          let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { return nil }
    let w = img.width, h = img.height
    guard x >= 0, x < w, y >= 0, y < h else { return nil }
    guard let ctx = CGContext(data: nil, width: 1, height: 1, bitsPerComponent: 8,
                              bytesPerRow: 4, space: CGColorSpace(name: CGColorSpace.sRGB)!,
                              bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return nil }
    // draw the image translated so that (x,y) lands at (0,0); flip y for CG coords
    ctx.translateBy(x: CGFloat(-x), y: CGFloat(y - h + 1))
    ctx.draw(img, in: CGRect(x: 0, y: 0, width: CGFloat(w), height: CGFloat(h)))
    guard let data = ctx.data else { return nil }
    let p = data.bindMemory(to: UInt8.self, capacity: 4)
    return (Int(p[0]), Int(p[1]), Int(p[2]), Int(p[3]))
}

let args = CommandLine.arguments
guard args.count >= 4 else { print("usage: pixelcheck file x y [x y ...]"); exit(1) }
let file = args[1]
var i = 2
while i + 1 < args.count {
    let x = Int(args[i])!, y = Int(args[i+1])!
    if let c = color(at: file, x: x, y: y) {
        print("(\(x),\(y)) rgb(\(c.0),\(c.1),\(c.2)) a=\(c.3)")
    } else {
        print("(\(x),\(y)) out of bounds or error")
    }
    i += 2
}