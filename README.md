# OPLA

https://3dviewer.net
https://bitbybit.dev
https://ocjs.org
https://zalo.github.io/CascadeStudio
https://www.cadsketcher.com
https://kevinlynagh.com/cadtron/
https://solvespace.com/index.pl

https://www.mecabricks.com

https://acidome.ru
https://www.gridsystem.dk
https://www.usm.com

https://drive.google.com/drive/mobile/folders/1SahJ4GmXHwj6lCpZ8Dgn3tAxVLWdSTN9?usp=sharing&fbclid=IwAR2dt1XszDsIYfvWROosCn8IIE-o6LetDrj1t98TCElarYRVz-w_o7k8Ros

https://variable.io/rat-systems/
https://www.clicktorelease.com/code/cross-hatching/

https://dev.by/news/woodberry-online-konstruktor-belorusskoi-mebeli

https://www.penzil.app
https://www.creativeapplications.net/nft/primitifs-systematiques-david-umemoto-anaglyphic/

add some screen space reflections 
https://github.com/0beqz/screen-space-reflections

## Opla Model v1

Objects in schema version `1` is positioned at `[0.5, 0.5, 0.5]` for *zero*.

Schema:
```ts
type OplaModel1 = {
    version: "1"
    items: Record<string, {
        id: string
        type: "box"
        position: [number, number, number]
        size: [number, number, number]
    } | {
        id: string
        type: "group"
        position: [number, number, number]
        children: string[]
    }>
    scene: string[]
}
```

Example:
```json
{
    version: "1",
    scene: [
        "2x2x2-0",
        "2x2x2-1",
        "2x2x2-2",
        // "3x3x3",
    ],
    items: {
        "2x2x2-0": {
            id: "2x2x2-0",
            type: "box",
            position: [0.5, 0.5, 0.5],
            size: [2, 2, 2],
        },
        "2x2x2-1": {
            id: "2x2x2-1",
            type: "box",
            position: [0.5, 2.5, 0.5],
            size: [2, 2, 2],
        },
        "2x2x2-2": {
            id: "2x2x2-2",
            type: "box",
            position: [0.5, 4.5, 0.5],
            size: [2, 2, 2],
        },
        "3x3x3": {
            id: "3x3x3",
            type: "box",
            position: [6, 1, 1],
            size: [3, 3, 3],
        },
        // "group-1": {
        //     id: "group-1",
        //     type: "group",
        //     position: [0, 0, 0],
        //     children: ["2x2x2-0"],
        // },
    },
}
```

## Dev

### Backend

Run this command. It will enable automatic migrations according to [this](https://pocketbase.io/docs/go-migrations/) docs.

```
go run main.go serve
```

When edit `*.go` files.
