package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
)

func spriteBundle(dir string) {
	spritePath := filepath.Join(dir, "sprites")
	fmt.Println("sprites:", spritePath)

	spriteDir, err := ioutil.ReadDir(spritePath)
	if err != nil {
		panic(err)
	}

	for _, info := range spriteDir {
		name := info.Name()
		path := filepath.Join(spritePath, name)
		sheet := filepath.Join(dir, "public", "sprites", name)
		fmt.Println(name, "->", sheet)
		spritePacker(path, sheet)
	}
}

func main() {
	dir := os.Args[1]
	spriteBundle(dir)
}
