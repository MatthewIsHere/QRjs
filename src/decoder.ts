interface QRData {
    width: number,
    height: number,
    imageData: ImageData,
    bitmap: Uint8Array
}

interface Pixel {
    r: number,
    g: number,
    b: number,
    a: number
}


class QRCode implements QRData {
    width: number
    height: number
    imageData: ImageData
    bitmap: Uint8Array

    constructor(height: number, width: number, imageData: ImageData) {
        this.height = height
        this.width = width
        this.imageData = imageData
        this.bitmap = this.getBitmapFromImageData() //Needs to go to detector.js after becoming this. Thats the start of madness. here we go.
    }

    public static fromCanvas(canvas: HTMLCanvasElement): QRCode {
        let height = canvas.height
        let width = canvas.width
        let imageData = canvas.getContext("2d")?.getImageData(0, 0, width, height)
        if (imageData === undefined) throw "No Canvas Data!"
        return new QRCode(height, width, imageData)
    }
    public static fromVideo(video: HTMLVideoElement) {
        let height = video.videoHeight
        let width = video.videoWidth
        let canvas = document.createElement("canvas")
        canvas.height = height
        canvas.width = width
        let context = canvas.getContext("2d")
        context?.drawImage(video, 0, 0)
        let imageData = context?.getImageData(0, 0, width, height)
        if (imageData === undefined) throw "No Media Data!"
        return new QRCode(height, width, imageData)
    }

    public getPixel(x: number, y: number): Pixel {
            if (x > this.width || y > this.height) throw "point out of bounds"
            let reference = (x * 4) + (y * 4 * this.width) // gets index of start of pixel RGBA
            let r = this.imageData.data[reference + 0]
            let g = this.imageData.data[reference + 1]
            let b = this.imageData.data[reference + 2]
            let a = this.imageData.data[reference + 3]
            return { r, g, b, a }
    }
    public grayscalePixel(x: number, y: number): number {
        let { r, g, b } = this.getPixel(x, y)
        r = r * 33
        g = g * 34
        b = b * 33
        let grayscale = (r + g + b) / 100 // Trusting the math here
        return grayscale
    }
    private static middleBrightnessPerSection(pixelArrayWidth: number, pixelArrayHeight: number, pixelArray: Uint8Array): Uint8Array { // going to return some type of 2d array of the qr canvas
        let numSqrtArea = 4; //Arbitrary number that was in the code i ported from. I don't understand, i just write
        var areaWidth = Math.floor(pixelArrayWidth / numSqrtArea);
        var areaHeight = Math.floor(pixelArrayHeight / numSqrtArea);
        let minMaxBrightnessPerSector: number[][][] = []
        let middleBrightnessArrayBuffer: ArrayBuffer = new ArrayBuffer(numSqrtArea * numSqrtArea)
        let middleBrightnessPerSection: Uint8Array = new Uint8Array(middleBrightnessArrayBuffer)
        for (let  x = 0; x < numSqrtArea; x++) { //Array Initialization loops, not sure if completely necessary
            minMaxBrightnessPerSector[x] = []
            for (let y = 0; y < numSqrtArea; y++) {
                minMaxBrightnessPerSector[x][y] = [0xFF, 0] // Darkest and brightest pixel of section
            }
        }
        for (var ay = 0; ay < numSqrtArea; ay++) { //this loop takes all the pixels in the sector and compares them to the highest and lowest brightnesses of their sector. inner most array is the high and lows of the sector
            for (var ax = 0; ax < numSqrtArea; ax++) {
                for (let dx = 0; dx < areaWidth; dx++) {
                    for (let dy = 0; dy < areaHeight; dy++) {
                        let pixel = pixelArray[areaWidth * ax + dx + (areaHeight * ay + dy) * pixelArrayWidth];
                        if (pixel < minMaxBrightnessPerSector[ax][ay][0]) //checks to see if it is darkest pixel
                            minMaxBrightnessPerSector[ax][ay][0] = pixel;
                        if (pixel > minMaxBrightnessPerSector[ax][ay][1]) //checks to see if it is brightest pixel
                            minMaxBrightnessPerSector[ax][ay][1] = pixel;
                    }
                }
                middleBrightnessPerSection[numSqrtArea * ay + ax] = Math.floor((minMaxBrightnessPerSector[ax][ay][0] + minMaxBrightnessPerSector[ax][ay][1]) / 2)
            }
        }
        return middleBrightnessPerSection
    }
    public getBitmapFromImageData(): Uint8Array {
        let grayscaleBuffer: ArrayBuffer = new ArrayBuffer(this.width * this.height) // buffer for image with 1 byte per pixel
        let view: Uint8Array = new Uint8Array(grayscaleBuffer) //view of buffer as 1 byte array
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let gray = this.grayscalePixel(x, y)
                view[x + y * this.width] = gray //fills buffer with gray pixel byte at its index
            }
        }
        let middleBrightness: Uint8Array = QRCode.middleBrightnessPerSection(this.width, this.height, view)
        let sqrtNumArea = middleBrightness.length
        let areaHeight = Math.floor(this.height / sqrtNumArea)
        let areaWidth = Math.floor(this.width / sqrtNumArea)
        let bitmapBuffer: ArrayBuffer = new ArrayBuffer(this.width * this.height)
        let bitmap: Uint8Array = new Uint8Array(bitmapBuffer)
        for (let ay = 0; ay < sqrtNumArea; ay++) {
            for (let ax  = 0; ax < sqrtNumArea; ax++) {
                for (let dy = 0; dy < areaHeight; dy++) {
                    for (let dx = 0; dx < areaWidth; dx++) {
                        let currentPixel = areaHeight * ax + dx + (areaHeight * ay + dy) * this.width
                        bitmap[currentPixel] = (view[currentPixel] < middleBrightness[sqrtNumArea*ay + ax]) ? 0xFF : 0x00 // cant use booleans, so just use 255 and 0
                    }
                }
            }
        }
        return bitmap
   }
}

interface Result {
    success: boolean,
    data: any | undefined
}

class QRResult implements Result {
    success: boolean;
    data: string | undefined
    constructor(success: boolean, text?: string) {
        this.success = success
        this.data = text
    }
}

class QRDecoder {
    async decode(code: QRCode): Promise<QRResult> {
        return new Promise(resolve => {
            return new QRResult(true, "Poop") //Temporary Function Body, Ignore okay? cool. thanks
        })
    }
}

