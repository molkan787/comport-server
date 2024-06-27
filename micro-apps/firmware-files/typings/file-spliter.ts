export interface SplitFileOptions{
    isStock: boolean,
    microModel: string,
    fileData: ReadableStream
}

export interface BlockInfo{
    Name: string,
    Offset: number,
    Length: number,
}