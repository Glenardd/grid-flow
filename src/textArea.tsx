export function textArea(text: string ,onchange: (text: string)=> void) {
    console.log("text area called with text:", text);
    onchange(text)
};