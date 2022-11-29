$(document).ready(function () {
    // alert(); 
})

//show Team Tab
$('#teamButton').on('click', function () {
    $('#team').show();
    $('#Dashboard').hide();
    $('#projects').hide();
});

$('#projectButton').on('click', function () {
    $('#team').hide();
    $('#Dashboard').hide();
    $('#projects').show();
});

$('#dashboardButton').on('click', function () {
    $('#team').hide();
    $('#Dashboard').show();
    $('#projects').hide();
});

$('#darkMode').onclick(function () {
    let a = $(this).val();
    console.log("ragvblnjk");
})