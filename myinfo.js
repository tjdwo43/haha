
$('#my_photo').on('drop', function(e) {
    e.preventDefault();
    uploadProfile(e.originalEvent.dataTransfer.files[0].path);
});

$('#my_file').on('change', function(e) {
    if (e.target.files[0].path)
        uploadProfile(e.target.files[0].path);
});

$('#my_status').textbox({
    onClickButton: function() {
        myInfo.message = $('#my_status').textbox('getText');
        updateProfile();
    }
});

function removeProfile() {
    myInfo.photo = '';
    updateProfile();
}
