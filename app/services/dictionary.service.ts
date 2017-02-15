import { Injectable } from '@angular/core';
let sqlite = require('nativescript-sqlite');


@Injectable()
export class Dictionary {

    private db = null;
    constructor() {
        if (!sqlite.exists("hFarsi-sqlite")) {
            console.log('database not exist');
            sqlite.copyDatabase("hFarsi-sqlite");
        }

        if (sqlite.exists("hFarsi-sqlite")) {
            console.log('data exist');
        }

        new sqlite("hFarsi-sqlite",  (err, dbConnection)=> {
            if (err) {
                console.log(err);
            }
            else{
                this.db = dbConnection;
                console.log('this.db');
                this.db.resultType(sqlite.RESULTSASOBJECT);
            }
        });
    }


    public getMeaning(word: string) {
        let meaning = "i don't know";
        this.db.get('select w, m from word where w = ? ', [word.toLowerCase()], function(err,row){
            // console.log('err -> ',err);
            // console.log('row -> ',row.m);

            if(row && 'm' in row){
                // console.dump(row)

                meaning = row.m;
            }
        });

        return meaning;
    }
}