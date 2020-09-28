package main

import (
	"image"
	"image/draw"
	"image/png"
	"io/ioutil"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

type sprite struct {
	x     int
	y     int
	image *image.RGBA
}

func spritePacker(path, to string) {
	dir, err := ioutil.ReadDir(path)
	if err != nil {
		panic(err)
	}

	const limit = 1024

	var wad strings.Builder
	x := 0
	y := 0
	sheetWidth := 0
	sheetHeight := 0

	images := make([]*sprite, 0)

	for _, info := range dir {
		name := info.Name()
		extension := filepath.Ext(name)
		base := strings.TrimSuffix(name, extension)
		if extension != ".png" {
			continue
		}
		rgba := getPng(filepath.Join(path, info.Name()))
		width := rgba.Rect.Size().X
		height := rgba.Rect.Size().Y

		if x+width+1 > limit {
			sheetWidth = x - 1
			x = 0
			y = sheetHeight + 1
		}

		save := &sprite{x: x, y: y, image: rgba}
		images = append(images, save)

		wad.WriteString(base)
		wad.WriteString("[")
		wad.WriteString(strconv.Itoa(x))
		wad.WriteString(",")
		wad.WriteString(strconv.Itoa(y))
		wad.WriteString(",")
		wad.WriteString(strconv.Itoa(width))
		wad.WriteString(",")
		wad.WriteString(strconv.Itoa(height))
		wad.WriteString("]\n")

		x += width + 1

		if y+height > sheetHeight {
			sheetHeight = y + height
		}
	}

	if x-1 > sheetWidth {
		sheetWidth = x - 1
	}

	power := 1
	for power < sheetWidth {
		power *= 2
	}
	sheetWidth = power

	power = 1
	for power < sheetHeight {
		power *= 2
	}
	sheetHeight = power

	sheet := image.NewRGBA(image.Rect(0, 0, sheetWidth, sheetHeight))

	for i := 0; i < len(images); i++ {
		source := images[i]
		point := image.Point{source.x, source.y}
		bounds := image.Rectangle{point, point.Add(source.image.Bounds().Size())}
		draw.Draw(sheet, bounds, source.image, image.Point{0, 0}, draw.Src)
	}

	writePng(filepath.Join(to, filepath.Base(path)+".png"), sheet)
	writeTxt(filepath.Join(to, filepath.Base(path)+".wad"), wad.String())
}

func getPng(path string) *image.RGBA {
	file, err := os.Open(path)
	if err != nil {
		panic(err)
	}
	defer file.Close()
	png, err := png.Decode(file)
	if err != nil {
		panic(err)
	}
	rgba := image.NewRGBA(png.Bounds())
	draw.Draw(rgba, rgba.Bounds(), png, image.Point{0, 0}, draw.Src)
	return rgba
}

func writePng(path string, image *image.RGBA) {
	err := os.MkdirAll(filepath.Dir(path), os.ModePerm)
	if err != nil {
		panic(err)
	}
	file, err := os.Create(path)
	if err != nil {
		panic(err)
	}
	defer file.Close()
	err = png.Encode(file, image)
	if err != nil {
		panic(err)
	}
}

func writeTxt(path string, text string) {
	file, err := os.Create(path)
	if err != nil {
		panic(err)
	}
	defer file.Close()
	_, err = file.WriteString(text)
	if err != nil {
		panic(err)
	}
}
