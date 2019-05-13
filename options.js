
var options = readData('option');
var radius = options[0] == false ? 'style="border-radius:0"' : '';

function setLanguage2() {

//  currentLanguage = 'en';

    $('#options').datalist({
        data: [
            {"group": $.lang[currentLanguage][51], "item": $.lang[currentLanguage][52], "checked": options[0]},
            {"group": $.lang[currentLanguage][53], "item": $.lang[currentLanguage][54], "checked": options[1]},
            {"group": $.lang[currentLanguage][53], "item": $.lang[currentLanguage][55], "checked": options[2]},
            {"group": $.lang[currentLanguage][56], "item": $.lang[currentLanguage][57], "checked": options[3]},
        ],
        textField: 'item',
        groupField: 'group'
    });

    $('#options').datagrid({'onSelect': function(index) {
        options[index] = true;
        writeData('option', options);
    }});
    
    $('#options').datagrid({'onUnselect': function(index) {
        options[index] = false;
        writeData('option', options);
    }});
}
