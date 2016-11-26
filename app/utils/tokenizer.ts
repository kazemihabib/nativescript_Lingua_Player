enum ILetterType{
    word,
    notWord,
    line
}
export class Tokenizer{
    private static isWordSeparator(c){
        return [' ', '.', ',', ';', '!', ':', '?', '@', '%', '^', '&', '=','$','*',
            '\t', '-', '/', '\\', '|', '"', '”', '”', '<', '>', '(', ')'].indexOf(c) >= 0;
    };

    public static splitWords = function(str){
        let s = str.replace('<br/>', ' ').replace('<br />', ' ');
        s = s.replace('<i>', ' ').replace('</i>', ' ');
        let ret :{'text':string,'isWord':boolean,'isNotWord':boolean,'isLine':boolean}[] = [];
        let prevLetterType:ILetterType = null;
        let len = s.length;
        for (let i = 0; i < len; i++) {
            let currentLetter = s[i];
            let currentLetterType:ILetterType; 
            if(this.isWordSeparator(currentLetter))
               currentLetterType = ILetterType.notWord; 

            else if(currentLetter == '\n')
               currentLetterType = ILetterType.line;

            else 
                currentLetterType = ILetterType.word;



            /* if current and previous letter has not same type */
            if (currentLetterType != prevLetterType){

                ret.push({'text': '','isWord':false,'isNotWord':false,'isLine':false});
                    if ( currentLetterType == ILetterType.line)
                        ret[ret.length - 1]['isLine'] = true;

                    else if (currentLetterType == ILetterType.word){ 
                        ret[ret.length - 1]['isWord'] = true;
                    }
                    else 
                        ret[ret.length - 1]['isNotWord'] = true;
                
            }
            prevLetterType = currentLetterType;
            ret[ret.length - 1]['text'] = ret[ret.length - 1]['text'] + currentLetter;
        }

        return ret;

    };
}