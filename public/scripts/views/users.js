function showConfirmBox(title, message, callback_fn) {
    callback = callback_fn;
    $('#modalTitle').text(title);
    $('#modalMsg').text(message);
    $('#confirmModal').modal('show');
}

function hideConfirmBox() {
    $('#confirmModal').modal('hide');
}

$('.viewAttendance').on('click', function () {
    const name = $(this).attr('name');
    $(".common-modal-body").load("/users/attendance?id=" + $(this).attr('id'), function () {
        $('.common-modal-header').text(name + ' - Attendance');
        $('#commonModal').modal('show');
    });
});