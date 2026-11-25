# TaskManager

Helyi feladatkezelő Angular felülettel, Express API-val és WebSocket alapú élő frissítéssel. A feladatokat MongoDB tárolja.

## Előkészületek

Node.js 22 és futó MongoDB szükséges.

~~~powershell
cd backend
npm install
~~~

### MongoDB

Az alapértelmezett cím 'mongodb://127.0.0.1:27017', az adatbázis neve 'task', a kollekció neve 'tasks'. A 'MONGODB_URI' és 'MONGODB_DB' környezeti változókkal módosíthatók. Az alapértelmezés kizárólag helyi, hitelesítés nélküli fejlesztésre való; ha a kapcsolati cím hitelesítési adatokat tartalmaz, ne oszd meg és ne töltsd fel.

## Indítás

Két terminálban:

~~~powershell
cd backend
npm start
~~~

~~~powershell
cd frontend
npm install
npm start
~~~

Nyisd meg a http://localhost:4200 címet. A backend a 'tasks' kollekcióban tárolja a feladatokat. Az alkalmazáson keresztüli módosítások több megnyitott ablakban automatikusan megjelennek; a közvetlen fájl- vagy adatbázis-módosítások nem váltanak ki WebSocket-értesítést.

Ha a WebSocket-kapcsolat megszakad, a kliens automatikusan újracsatlakozik, és megkapja a friss listát.

Az "Új feladat" gomb PrimeNG dialógusában a státusz is kiválasztható ('TODO', 'IN PROGRESS' vagy 'DONE'), alapértelmezésként 'TODO'. A státusz később a feladat szerkesztésekor módosítható.

Mentés indításakor a dialógus bezárul. Ha a mentés nem sikerül, a hiba a főoldalon jelenik meg, az űrlapot pedig újra ki kell tölteni.

A feladathoz opcionális határidő adható meg: a dátumot a PrimeNG naptárból vagy 'ÉÉÉÉ. HH. NN.' formában lehet kiválasztani. A határidő időpont és időzóna nélkül, 'ÉÉÉÉ-HH-NN' dátumként kerül tárolásra. A felhasználó eszközének mai dátumához viszonyítva a ma esedékes feladat "hamarosan lejár", a korábbi határidő pedig "lejárt"; a kész feladatok nem kapnak figyelmeztetést. A jelzések percenként frissülnek; háttérben a böngésző ezt késleltetheti.

Az API csak dátumot fogad el határidőként, és a WebSocket is dátumot ad vissza. A cím és a leírás hosszát nem korlátozzuk külön, de a teljes JSON-kérés felső határa 100 KiB; a MongoDB-dokumentumok mérethatára 16 MiB.

Az összesítő csík a státuszok arányát mutatja: piros a 'TODO', sárga az 'IN PROGRESS', zöld a 'DONE'. A csík egy szakaszára kattintva a lista az adott státuszra szűrhető; az "Összes feladat" gombbal vagy a szakaszra újra kattintva a szűrés törölhető.

A fejléc a hamarosan lejáró és lejárt feladatok számát is mutatja. A számlálókra kattintva a lista határidő szerint szűrhető. Újabb kattintással vagy az "Összes feladat" gombbal a szűrés törölhető. A határidő- és státuszszűrő egymást váltja.

## AI-eszköz használata

A fejlesztés során GitHub Copilotot használtam a README írásához, stílusozáshoz, refaktoráláshoz, validáció írásokhoz és kódellenőrzéshez.
