import Foundation
import CoreGraphics
import ImageIO

/* ============================================================
   Chain Reaction Words - icon generator
   Draws the app icon (two interlocked chain links + lightning
   bolt) with CoreGraphics and exports every size needed:
     - 1024  master (kept for reference)
     - 512   Play Console store icon
     - 432   adaptive-icon foreground / background / monochrome
     - 48/72/96/144/192  legacy launcher PNGs (mdpi..xxxhdpi)
   ============================================================ */

let sRGB = CGColorSpace(name: CGColorSpace.sRGB)!

func makeContext(_ size: Int) -> CGContext {
    CGContext(data: nil, width: size, height: size, bitsPerComponent: 8,
              bytesPerRow: 0, space: sRGB,
              bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
}

func savePNG(_ ctx: CGContext, _ path: String) {
    guard let img = ctx.makeImage() else { fatalError("makeImage failed") }
    let url = URL(fileURLWithPath: path) as CFURL
    guard let dest = CGImageDestinationCreateWithURL(url, "public.png" as CFString, 1, nil)
    else { fatalError("dest failed for \(path)") }
    CGImageDestinationAddImage(dest, img, nil)
    CGImageDestinationFinalize(dest)
}

func drawBackground(_ ctx: CGContext, _ size: CGFloat) {
    let colors = [
        CGColor(colorSpace: sRGB, components: [1.0, 0.604, 0.239, 1.0])!, // FF9A3D
        CGColor(colorSpace: sRGB, components: [1.0, 0.239, 0.467, 1.0])!  // FF3D77
    ] as CFArray
    let grad = CGGradient(colorsSpace: sRGB, colors: colors, locations: [0, 1])!
    ctx.drawLinearGradient(grad, start: CGPoint(x: 0, y: size), end: CGPoint(x: size, y: 0), options: [])
}

/* Art is drawn in a 1024x1024 master coordinate system centered at (0,0). */
func drawArt(_ ctx: CGContext, artScale: CGFloat, mono: Bool) {
    ctx.saveGState()
    ctx.setLineJoin(.round)

    let white = CGColor(colorSpace: sRGB, components: [1, 1, 1, 1])!
    let gold  = CGColor(colorSpace: sRGB, components: [1.0, 0.831, 0.278, 1.0])! // FFD447

    // ---- interlocked chain links ----
    ctx.setLineWidth(46 * artScale)
    ctx.setStrokeColor(mono ? white : white)

    let linkRect = CGRect(x: -210 * artScale, y: -140 * artScale,
                          width: 420 * artScale, height: 280 * artScale)
    let cr = 140 * artScale

    // left link, tilted +30
    ctx.saveGState()
    ctx.translateBy(x: -165 * artScale, y: 35 * artScale)
    ctx.rotate(by: 30 * .pi / 180)
    ctx.addPath(CGPath(roundedRect: linkRect, cornerWidth: cr, cornerHeight: cr, transform: nil))
    ctx.strokePath()
    ctx.restoreGState()

    // right link, tilted -30
    ctx.saveGState()
    ctx.translateBy(x: 165 * artScale, y: -35 * artScale)
    ctx.rotate(by: -30 * .pi / 180)
    ctx.addPath(CGPath(roundedRect: linkRect, cornerWidth: cr, cornerHeight: cr, transform: nil))
    ctx.strokePath()
    ctx.restoreGState()

    // ---- lightning bolt at the crossing point ----
    let b: [CGPoint] = [
        CGPoint(x: 30, y: 120), CGPoint(x: -40, y: 0), CGPoint(x: -10, y: 0),
        CGPoint(x: -30, y: -120), CGPoint(x: 40, y: 0), CGPoint(x: 10, y: 0)
    ].map { CGPoint(x: $0.x * 1.55 * artScale, y: $0.y * 1.55 * artScale) }

    ctx.beginPath()
    ctx.move(to: b[0])
    for i in 1..<b.count { ctx.addLine(to: b[i]) }
    ctx.closePath()
    ctx.setFillColor(mono ? white : gold)
    ctx.fillPath()

    ctx.restoreGState()
}

/* Render one icon PNG. */
func render(size: Int, artScale: CGFloat, bg: Bool, mono: Bool, out: String) {
    let ctx = makeContext(size)
    let s = CGFloat(size)
    if bg { drawBackground(ctx, s) }
    ctx.translateBy(x: s / 2, y: s / 2)
    ctx.scaleBy(x: s / 1024, y: s / 1024)
    drawArt(ctx, artScale: artScale, mono: mono)
    savePNG(ctx, out)
    print("wrote \(out)")
}

let args = CommandLine.arguments
guard args.count == 2 else {
    print("usage: swift make-icons.swift <project-root>")
    exit(1)
}
let root = args[1]
let tools = root + "/tools"
let store = root + "/store-listing"
let res = root + "/android/app/src/main/res"

/* master + Play Console store icon */
render(size: 1024, artScale: 1.0, bg: true, mono: false, out: tools + "/icon-master-1024.png")
render(size: 512,  artScale: 1.0, bg: true, mono: false, out: store + "/icon-512.png")

/* adaptive icon layers (432px canvas; art kept inside the 66% safe zone) */
render(size: 432, artScale: 0.27, bg: false, mono: false, out: res + "/mipmap-xxxhdpi/ic_launcher_foreground.png")
render(size: 432, artScale: 0.27, bg: true,  mono: false, out: res + "/mipmap-xxxhdpi/ic_launcher_background.png")
render(size: 432, artScale: 0.27, bg: false, mono: true,  out: res + "/mipmap-xxxhdpi/ic_launcher_monochrome.png")

/* legacy launcher icons */
let sizes = [("mdpi", 48), ("hdpi", 72), ("xhdpi", 96), ("xxhdpi", 144), ("xxxhdpi", 192)]
for (dpi, px) in sizes {
    render(size: px, artScale: 0.92, bg: true, mono: false, out: res + "/mipmap-\(dpi)/ic_launcher.png")
    render(size: px, artScale: 0.92, bg: true, mono: false, out: res + "/mipmap-\(dpi)/ic_launcher_round.png")
}