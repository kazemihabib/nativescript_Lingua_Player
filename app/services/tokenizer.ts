export class Tokenizer{
    private static isWordSeparator(c){
        return [' ', '.', ',', ';', '!', ':', '?', '@', '%', '^', '&', '=','$','*',
            '\t', '-', '/', '\\', '|', '"', '”', '”', '<', '>', '\n', '(', ')'].indexOf(c) >= 0;
    };

    public static splitWords = function(str){
        let s = str.replace('<br/>', ' ').replace('<br />', ' ');
        s = s.replace('<i>', ' ').replace('</i>', ' ');
        let ret = [{'text': ''}];
        let prevLetterIsWordSeparator= false;
        let len = s.length;
        for (let i = 0; i < len; i++) {
            let currentLetter = s[i];
            let currentLetterIsWordSeparator = this.isWordSeparator(currentLetter);

                /* if current and previous letter has same type */
                if (currentLetterIsWordSeparator != prevLetterIsWordSeparator){
                    if (ret[ret.length - 1]['text'] != ''){ 
                        if (!prevLetterIsWordSeparator) 
                            ret[ret.length - 1]['isWord'] = true;
                        else 
                            ret[ret.length - 1]['isWord'] = false;
                        ret.push({'text':''});
                    }
                }
            prevLetterIsWordSeparator = this.isWordSeparator(currentLetter);
            ret[ret.length - 1]['text'] = ret[ret.length - 1]['text'] + currentLetter
        }
        if (! prevLetterIsWordSeparator) ret[ret.length - 1]['isWord'] = true;
        else ret[ret.length - 1]['isWord'] = false;

        return ret;

    };
}