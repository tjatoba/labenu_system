export const convertDate = (data: string) => {
    return data.split("/").reverse().join("-")
}
