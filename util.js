//const server = 'http://localhost:8080/rest';
const server = 'http://talk.officehub.kr:8080/rest';
const server2 = 'http://talk.officehub.kr/';

window.$ = window.jQuery = require('./easyui/jquery.min.js');

const fs = require('fs');
const request = require('request');
const { shell, ipcRenderer, Tray } = require('electron');

// Prevent drag and drop
$('body').on('dragover', function(e) { e.preventDefault(); });
$('body').on('dragleave', function(e) { e.preventDefault(); });
$('body').on('drop', function(e) { e.preventDefault(); });

// Read a page's GET URL variables and return them as an associative array.
function getUrlVars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function print(text) {
    process.stdout.write(text + '\n');
}

function findById(list, id) {
    if (list.length == 0) return null;
    var result = $.grep(list, function(e) { return e.id == id; });
    if (result.length == 0) return null;
    if (result.length >= 1) return result[0];
}

function removeById(list, id) {
    for (i in list) {
        if (list[i].id == id) {
            list.splice(i, 1);
            return true;
        }
    }
    return false;
}

function addList(list, obj) {
    if (findById(list, obj.id)) {
        console.log(obj.id);
        return false;
    }
    list.push(obj);
    return true;
}

function addBuddy(buddy) {

    if (buddy.id == 0 || buddy.id == myInfo.id) return;
    
    removeById(buddyList, buddy.id);
    addList(buddyList, buddy);
}

function sortByName(list) {
    list.sort(function(a, b) {
        var aName = a.name.toLowerCase();
        var bName = b.name.toLowerCase(); 
        return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
    });
}

function sortByDate(list) {
    list.sort(function(a, b) {
        var aName = a.cdate;
        var bName = b.cdate; 
        return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
    });
}

function sortByDateDesc(list) {
    list.sort(function(a, b) {
        var aName = b.cdate;
        var bName = a.cdate; 
        return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
    });
}

function sortByDateDesc2(list) {
    list.sort(function(a, b) {
        var aName = b.message.cdate;
        var bName = a.message.cdate; 
        return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
    });
}

function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
}

function b64DecodeUnicode(str) {
    return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join('')).replace(/(<([^>]+)>)/ig,"");
}

function localTime(str) {
    var date = new Date(str + ' UTC');
    return date.toLocaleTimeString();
}

function localDateTime(str) {
    var date = new Date(str + ' UTC');
    if (isToday(str))
        return localTime(str);
    else
        return date.toLocaleDateString();
}

function isToday(str) {
    var date = new Date(str + ' UTC');
    var today = new Date(currentTime() + ' UTC');
    return (today.toDateString() == date.toDateString())
}

function currentTime() {
    var today = new Date();
    var date = today.getUTCFullYear() + '-' + (today.getUTCMonth() + 1) + '-' + today.getUTCDate()
    var time = today.getUTCHours() + ':' + today.getUTCMinutes() + ':' + today.getUTCSeconds();
    return date + ' ' + time;
}

function readHtml(path) {
    if (!fs.existsSync(path)) return null;
    var data = fs.readFileSync(path, 'utf8');
    return data;
}

function getVersion() {
    var path = 'package.json';
    if (!fs.existsSync(path)) return '';
    var data = fs.readFileSync(path, 'utf8');
    if (data == null) return '';
    var package = $.parseJSON(data);
    return package ? package.version : '';
}

function readData(filename) {
    var path = './data/' + filename + '.json';
    if (!fs.existsSync(path)) return null;
    var data = fs.readFileSync(path, 'utf8');
    return data ? JSON.parse(data) : null;
}

function readList(filename) {
    var list = readData(filename);
    if (list == null) list = [];
    return list;
}

function writeData(filename, obj) {
    var path = './data/' + filename + '.json';
    var data = JSON.stringify(obj);
    if (data)
        fs.writeFileSync(path, data, 'utf8');
}

function deleteData(filename) {
    var path = './data/' + filename + '.json';
    console.log(path);
    if (!fs.existsSync(path)) return null;
    fs.unlinkSync(path);
}

function deleteAllData() {
    var files = fs.readdirSync('./data/.');
    for (i in files) {
        var match = files[i].match(/.*.json/);
        if(match == null) continue;
        console.log(match)
        deleteData(match[0].replace('.json', ''));
    }
}

function popMessageId() {
    var id = 0;
    var files = fs.readdirSync('./data/.');
    for (i in files) {
        var match = files[i].match(/messageList-.*.json/);
        if(match == null) continue;
        var messages = readList(match[0].replace('.json', ''));
        if (messages.length == 0) continue;
        if (id < messages[messages.length - 1].id)
            id = messages[messages.length - 1].id;
    }
    return id;
}

function isImageFile(filename) {
    var path = filename.toLowerCase();
    if (path.indexOf('.png') > 0) return true;
    if (path.indexOf('.jpg') > 0) return true;
    if (path.indexOf('.gif') > 0) return true;
    return false;
}

function truncText(text, n, boundary) {
    if (text.length <= n) return text;
    var subString = text.substr(0, n - 1);
    if (boundary == undefined) return subString + "...";
    return subString.substr(0, subString.lastIndexOf(boundary)) + ", ...";
};

function statusText(text) {
    if (!text || text == 'null') return '';
    text = text.replace('\r', ' ');
    text = text.replace('\n', ' ');
    return truncText(text, 40);
}

function messageText(text) {
    return truncText(text, 40);
}

function nameText(text) {
    return truncText(text, 16, ',');
}

function indexOfReply(messages, i) {
    if (i == 0) return i;
    if (checkMessage(messages[i]) > 0) return indexOfReply(messages, i - 1);
    var c1 = messages[i].sent - messages[i].repl;
    var c0 = messages[i - 1].sent - messages[i - 1].repl;
    if (c0 < c1) return i;
    return indexOfReply(messages, i - 1);
}

function increaseReply(messages, i) {
    if (messages.length == i) return i;
    if (checkMessage(messages[i]) > 0) return increaseReply(messages, i + 1);
    if (messages[i].repl == messages[i].sent) return i;
    messages[i].repl += 1;
    return increaseReply(messages, i + 1);
}

function checkMessage(message) {
    if (message.type >= 100) return message.type;
    if (message.user_id != myInfo.id) return message.user_id;
    return 0;
}

function company() {

    request(
        {
            url: 'http://license.officehub.kr/oauth2/company.php?key=1&name='
        },
        function (error, response, body) {

            if (response.statusCode == 200) {
   
                var list = $.parseJSON(body);
                var data = $('#company').combobox('getData');

                for (i in list) {

                    var text = list[i].name;
                    var host;

                    if (list[i].domain) {

                        host = list[i].domain.replace('http://', '').replace('/', '').trim();
                    }
                    else {
                        var ips = list[i].ip.split('/');
                        host = ips[ips.length - 1].trim();
                    }

                    data.push({text:text, value:host});

                    if (myInfo.host ? host == myInfo.host : i == 0) {

                        $('#company').combobox('select', text);
                        $('#company').combobox('setValue', host);
                    }
                }
                
                $('#company').combobox('loadData', data);
            }
        }
    );
}

function getUserProfile(host, email) {
    
    if (host == null)
        host = myInfo.host;

    var url = 'http://' + host + '/oauth2/userProfile.php?email=' + email;

    console.log(url);

    request(
        {
            url: url,
        },
        function (error, response, body) {
            if (response.statusCode == 200) {
                if (body == '') return;
                profile = $.parseJSON(body);
                console.log(profile);
                $('#user_name').text(profile.name);
                $('#user_comp').text(profile.company);
                $('#user_rank').text(profile.rank ? profile.rank : '');
                $('#user_part').text(profile.department);
                $('#user_phone').text(profile.phone.trim());
                $('#user_cell').text(profile.cell_phone);
                $('#user_email').text(profile.cell_email);
                $('#user_job').text(profile.job_position);
            }
            else
                console.log(response.statusCode);
        }
    );
}

function getCommand(text, type) {

    if (type > 0) return 0;
    var array = b64DecodeUnicode(text).split('/');
    if (array[0] != 'DISMISS') return 0;
    if (array[1] == undefined) return 0;
    if (array[1].length != 7) return 0;
    return parseInt(array[1]);
}

var currentLanguage = 'ko';

function setLanguage(oauth, logout) {

//  currentLanguage = 'en';

    if (oauth == true) return;

    $('[data-langNum]').each(function() {
        var $this = $(this); 
        $this.html($.lang[currentLanguage][$this.data('langnum')]);
    });

    if (logout == true) return;

    $('#username').textbox({ prompt : $.lang[currentLanguage][77] });
    $('#password').passwordbox({ prompt : $.lang[currentLanguage][78] });
    $('#company').textbox({ prompt : $.lang[currentLanguage][50] });

    $('#find').textbox({ prompt : $.lang[currentLanguage][31], buttonText: $.lang[currentLanguage][32] });
    $('#find2').textbox({ prompt : $.lang[currentLanguage][31], buttonText: $.lang[currentLanguage][32] });
    $('#my_status').textbox({ prompt : $.lang[currentLanguage][33], buttonText: $.lang[currentLanguage][34] });
    $('#user_status').textbox({ prompt : $.lang[currentLanguage][35] });
    $('#name_text').textbox({ buttonText : $.lang[currentLanguage][36] });
}
