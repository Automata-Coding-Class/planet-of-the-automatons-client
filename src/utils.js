function chooseRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

module.exports = {
    chooseRandomItem: chooseRandomItem
}