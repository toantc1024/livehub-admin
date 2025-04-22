export const KeyWRapper = (array) => {
    let i = 0;
    return array.map((item) => {
        return {
            ...item,
            key: i++
        }
    })
}