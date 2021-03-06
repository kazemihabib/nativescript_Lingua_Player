let sqlite = require('nativescript-sqlite');
let dbname = "medias.database";
let db = null;

export function initDataBase() {
    new sqlite(dbname, function (err, dbConnection) {
        if (err) {
            console.log(err);
        }
        else{
            db = dbConnection;
            db.resultType(sqlite.RESULTSASOBJECT);
            createTable();
        }
    });
}

export function isDatabaseReady(){
    return db != null ? true : false;
}

export function createTable() {
    db.version(function (err, ver) {
        console.log('version is ', ver);
        // if (ver <=3) {
            // db.execSQL(' DROP TABLE IF EXISTS Medias');
            let command:string = `Create TABLE IF NOT EXISTS Medias
                 (PATH varchar(500) UNIQUE,TITLE varchar(500), LENGTH int ,POSITION int , SUBLOCATION varchar(500), THUMBNAIL varchar(500) )`
            db.execSQL(command,function(err,id){
                if(err)
                    console.log('erro in create Table ' , err);
                if(id)
                    console.log('id of createTable ' , id);
            });
            // db.version(4); // Sets the version to 1
        // }
    });
}

export function getMediaInfo(path: string, callback) {
    db.get('select * from Medias where PATH = ? ', [path], callback);
}

export function insertMediaInfo(path: string, title: string, length: number, position: number, subLocation: string, thumbnail: string) {
    db.execSQL("insert into Medias (PATH, TITLE , LENGTH , POSITION , SUBLOCATION, THUMBNAIL) values (?,?,?,?,?,?)",
        [path, title, length, position, subLocation,thumbnail],
        function (err, id) {
            console.log("The new record id is:", id);
            if (err)
                console.log('error happend', err);
        })
}

export function updatePosition(path:string , position:number){
   let command = ` UPDATE Medias 
                   SET position = ?
                   WHERE PATH = ?;`;
                   
   db.execSQL(command,[position, path], function(err,id){
       console.log('update position ', id);
       if(err)
            console.log('error happend ',err);
   })                
}

export function updateSubLocation(path:string ,subLocation:string){

   let command = ` UPDATE Medias 
                   SET  SUBLOCATION = ?
                   WHERE PATH = ?;`;
                   
   db.execSQL(command,[subLocation, path], function(err,id){
       console.log('update subLocation ', id);
       if(err)
            console.log('error happend ',err);
   })                
}

export function deleteRow(path:string, callback){
    console.log('deleteRow');
    let command = `DELETE FROM MEDIAS 
                    WHERE PATH = ? ;`;

    db.execSQL(command,[path],callback);
}