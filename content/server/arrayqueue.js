module.exports = class ArrayQueue {
    constructor() {
        this.elements = [];
        this.length = 0;
    }

    isEmpty() {
        return (this.length == 0);
    }

    addElement(value) {
        this.elements[this.length] = value;
        this.length++;
    }

    getElement() {
        if(this.isEmpty()) return null;

        const element = this.elements[0];
        for (let index = 0; index < this.length; index++) {
            this.elements[index] = this.elements[index + 1];
        }
        this.elements.pop();
        this.length--;

        return element;
    }

    removeElement(element){
        if(this.isEmpty()) return null;

        var foundElement = false;
        for (let index = 0; index < this.length; index++) {
            if(this.elements[index] == element) foundElement = true;
            if(!foundElement) continue;
            this.elements[index] = this.elements[index + 1];
        }

        if(foundElement){
            this.elements.pop();
            this.length--;
        }
    }

    clear() {
        this.element = [];
        this.length = 0;
    }
}