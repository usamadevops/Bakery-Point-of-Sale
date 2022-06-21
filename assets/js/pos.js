let cart = [];
let index = 0;
let allUsers = [];
let allProducts = [];
let allCategories = [];
let allTransactions = [];
let sold = [];
let state = [];
let sold_items = [];
let item;
let auth;
let holdOrder = 0;
let vat = 0;
let perms = null;
let deleteId = 0;
let paymentType = 0;
let receipt = '';
let totalVat = 0;
let subTotal = 0;
let method = '';
let order_index = 0;
let user_index = 0;
let product_index = 0;
let transaction_index;
let host = 'localhost';
let path = require('path');
let port = '8001';
let moment = require('moment');
let Swal = require('sweetalert2');
let { ipcRenderer } = require('electron');
let dotInterval = setInterval(function () { $(".dot").text('.') }, 3000);
let Store = require('electron-store');
const remote = require('electron').remote;
const app = remote.app;
let img_path = process.env.APPDATA + '/POS/uploads/';
let api = 'http://' + host + ':' + port + '/api/';
let btoa = require('btoa');
let jsPDF = require('jspdf');
let html2canvas = require('html2canvas');
let JsBarcode = require('jsbarcode');
let macaddress = require('macaddress');
let categories = [];
let holdOrderList = [];
let customerOrderList = [];
let ownUserEdit = null;
let totalPrice = 0;
let orderTotal = 0;
let auth_error = 'Incorrect username or password';
let auth_empty = 'Please enter a username and password';
let holdOrderlocation = $("#randerHoldOrders");
let customerOrderLocation = $("#randerCustomerOrders");
let storage = new Store();
let settings;
let platform;
let user = {};
let start = moment().startOf('month');
let end = moment();
let start_date = moment(start).toDate();
let end_date = moment(end).toDate();
let by_till = 0;
let by_user = 0;
let by_status = 1;

$(function () {

    function cb(start, end) {
        $('#reportrange span').html(start.format('MMMM D, YYYY') + '  -  ' + end.format('MMMM D, YYYY'));
    }

    $('#reportrange').daterangepicker({
        startDate: start,
        endDate: end,
        autoApply: true,
        timePicker: true,
        timePicker24Hour: true,
        timePickerIncrement: 10,
        timePickerSeconds: true,
        // minDate: '',
        ranges: {
            'Today': [moment().startOf('day'), moment()],
            'Yesterday': [moment().subtract(1, 'days').startOf('day'), moment().subtract(1, 'days').endOf('day')],
            'Last 7 Days': [moment().subtract(6, 'days').startOf('day'), moment().endOf('day')],
            'Last 30 Days': [moment().subtract(29, 'days').startOf('day'), moment().endOf('day')],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
            'This Month': [moment().startOf('month'), moment()],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        }
    }, cb);

    cb(start, end);

});


$.fn.serializeObject = function () {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function () {
        if (o[this.name]) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};


auth = storage.get('auth');
user = storage.get('user');


if (auth == undefined) {
    $.get(api + 'users/check/', function (data) { });
    $("#loading").show();
    authenticate();

} else {

    $('#loading').show();

    setTimeout(function () {
        $('#loading').hide();
    }, 2000);

    platform = storage.get('settings');

    if (platform != undefined) {

        if (platform.app == 'Network Point of Sale Terminal') {
            api = 'http://' + platform.ip + ':' + port + '/api/';
            perms = true;
        }
    }

    $.get(api + 'users/user/' + user._id, function (data) {
        user = data;
        $('#loggedin-user').text(user.fullname);
    });


    $.get(api + 'settings/get', function (data) {
        settings = data.settings;
    });


    $.get(api + 'users/all', function (users) {
        allUsers = [...users];
    });



    $(document).ready(function () {

        $(".loading").hide();

        loadCategories();
        loadProducts();
        loadCustomers();


        if (settings && settings.symbol) {
            $("#price_curr, #payment_curr, #change_curr").text(settings.symbol);
        }


        setTimeout(function () {
            if (settings == undefined && auth != undefined) {
                $('#settingsModal').modal('show');
            }
            else {
                vat = parseFloat(settings.percentage);
                $("#taxInfo").text(settings.charge_tax ? vat : 0);
            }

        }, 1500);



        $("#settingsModal").on("hide.bs.modal", function () {

            setTimeout(function () {
                if (settings == undefined && auth != undefined) {
                    $('#settingsModal').modal('show');
                }
            }, 1000);

        });


        if (0 == user.perm_products) { $(".p_one").hide() };
        if (0 == user.perm_categories) { $(".p_two").hide() };
        if (0 == user.perm_transactions) { $(".p_three").hide() };
        if (0 == user.perm_users) { $(".p_four").hide() };
        if (0 == user.perm_settings) { $(".p_five").hide() };

        function loadProducts() {

            $.get(api + 'inventory/products', function (data) {

                data.forEach(item => {
                    item.price = parseFloat(item.price).toFixed(2);
                });

                allProducts = [...data];

                loadProductList();

                $('#parent').text('');
                $('#categories').html(`<button type="button" id="all" class="btn btn-categories btn-white waves-effect waves-light">All</button> `);

                data.forEach(item => {

                    if (!categories.includes(item.category)) {
                        categories.push(item.category);
                    }

                    let item_info = `<div class="col-lg-2 box ${item.category}"
                                onclick="$(this).addToCart(${item._id}, ${item.quantity}, ${item.stock})">
                            <div class="widget-panel widget-style-2 ">                    
                            <div id="image"><img src="${item.img == "" ? "./assets/images/default.jpg" : img_path + item.img}" id="product_img" alt=""></div>                    
                                        <div class="text-muted m-t-5 text-center">
                                        <div class="name" id="product_name">${item.name}</div> 
                                        <span class="sku">${item.sku}</span>
                                        <span class="stock">STOCK </span><span class="count">${item.stock == 1 ? item.quantity : 'N/A'}</span></div>
                                        <sp class="text-success text-center"><b data-plugin="counterup">${settings.symbol + item.price}</b> </sp>
                            </div>
                        </div>`;
                    $('#parent').append(item_info);
                });

                categories.forEach(category => {

                    let c = allCategories.filter(function (ctg) {
                        return ctg._id == category;
                    })

                    $('#categories').append(`<button type="button" id="${category}" class="btn btn-categories btn-white waves-effect waves-light">${c.length > 0 ? c[0].name : ''}</button> `);
                });

            });

        }

        function loadCategories() {
            $.get(api + 'categories/all', function (data) {
                allCategories = data;
                loadCategoryList();
                $('#category').html(`<option value="0">Select</option>`);
                allCategories.forEach(category => {
                    $('#category').append(`<option value="${category._id}">${category.name}</option>`);
                });
            });
        }


        function loadCustomers() {

            $.get(api + 'customers/all', function (customers) {

                $('#customer').html(`<option value="0" selected="selected">Walk in customer</option>`);

                customers.forEach(cust => {

                    let customer = `<option value='{"id": ${cust._id}, "name": "${cust.name}"}'>${cust.name}</option>`;
                    $('#customer').append(customer);
                });

                //  $('#customer').chosen();

            });

        }


        $.fn.addToCart = function (id, count, stock) {

            if (stock == 1) {
                if (count > 0) {
                    $.get(api + 'inventory/product/' + id, function (data) {
                        $(this).addProductToCart(data);
                    });
                }
                else {
                    Swal.fire(
                        'Out of stock!',
                        'This item is currently unavailable',
                        'info'
                    );
                }
            }
            else {
                $.get(api + 'inventory/product/' + id, function (data) {
                    $(this).addProductToCart(data);
                });
            }

        };


        function barcodeSearch(e) {

            e.preventDefault();
            $("#basic-addon2").empty();
            $("#basic-addon2").append(
                $('<i>', { class: 'fa fa-spinner fa-spin' })
            );

            let req = {
                skuCode: $("#skuCode").val()
            }

            $.ajax({
                url: api + 'inventory/product/sku',
                type: 'POST',
                data: JSON.stringify(req),
                contentType: 'application/json; charset=utf-8',
                cache: false,
                processData: false,
                success: function (data) {

                    if (data._id != undefined && data.quantity >= 1) {
                        $(this).addProductToCart(data);
                        $("#searchBarCode").get(0).reset();
                        $("#basic-addon2").empty();
                        $("#basic-addon2").append(
                            $('<i>', { class: 'glyphicon glyphicon-ok' })
                        )
                    }
                    else if (data.quantity < 1) {
                        Swal.fire(
                            'Out of stock!',
                            'This item is currently unavailable',
                            'info'
                        );
                    }
                    else {

                        Swal.fire(
                            'Not Found!',
                            '<b>' + $("#skuCode").val() + '</b> is not a valid barcode!',
                            'warning'
                        );

                        $("#searchBarCode").get(0).reset();
                        $("#basic-addon2").empty();
                        $("#basic-addon2").append(
                            $('<i>', { class: 'glyphicon glyphicon-ok' })
                        )
                    }

                }, error: function (data) {
                    if (data.status === 422) {
                        $(this).showValidationError(data);
                        $("#basic-addon2").append(
                            $('<i>', { class: 'glyphicon glyphicon-remove' })
                        )
                    }
                    else if (data.status === 404) {
                        $("#basic-addon2").empty();
                        $("#basic-addon2").append(
                            $('<i>', { class: 'glyphicon glyphicon-remove' })
                        )
                    }
                    else {
                        $(this).showServerError();
                        $("#basic-addon2").empty();
                        $("#basic-addon2").append(
                            $('<i>', { class: 'glyphicon glyphicon-warning-sign' })
                        )
                    }
                }
            });

        }


        $("#searchBarCode").on('submit', function (e) {
            barcodeSearch(e);
        });



        $('body').on('click', '#jq-keyboard button', function (e) {
            let pressed = $(this)[0].className.split(" ");
            if ($("#skuCode").val() != "" && pressed[2] == "enter") {
                barcodeSearch(e);
            }
        });



        $.fn.addProductToCart = function (data) {
            item = {
                id: data._id,
                product_name: data.name,
                sku: data.sku,
                price: data.price,
                quantity: 1
            };

            if ($(this).isExist(item)) {
                $(this).qtIncrement(index);
            } else {
                cart.push(item);
                $(this).renderTable(cart)
            }
        }


        $.fn.isExist = function (data) {
            let toReturn = false;
            $.each(cart, function (index, value) {
                if (value.id == data.id) {
                    $(this).setIndex(index);
                    toReturn = true;
                }
            });
            return toReturn;
        }


        $.fn.setIndex = function (value) {
            index = value;
        }


        $.fn.calculateCart = function () {
            let total = 0;
            let grossTotal;
            $('#total').text(cart.length);
            $.each(cart, function (index, data) {
                total += data.quantity * data.price;
            });
            total = total - $("#inputDiscount").val();
            $('#price').text(settings.symbol + total.toFixed(2));

            subTotal = total;

            if ($("#inputDiscount").val() >= total) {
                $("#inputDiscount").val(0);
            }

            if (settings.charge_tax) {
                totalVat = ((total * vat) / 100);
                grossTotal = total + totalVat
            }

            else {
                grossTotal = total;
            }

            orderTotal = grossTotal.toFixed(2);

            $("#gross_price").text(settings.symbol + grossTotal.toFixed(2));
            $("#payablePrice").val(grossTotal);
        };



        $.fn.renderTable = function (cartList) {
            $('#cartTable > tbody').empty();
            $(this).calculateCart();
            $.each(cartList, function (index, data) {
                $('#cartTable > tbody').append(
                    $('<tr>').append(
                        $('<td>', { text: index + 1 }),
                        $('<td>', { text: data.product_name }),
                        $('<td>').append(
                            $('<div>', { class: 'input-group' }).append(
                                $('<div>', { class: 'input-group-btn btn-xs' }).append(
                                    $('<button>', {
                                        class: 'btn btn-default btn-xs',
                                        onclick: '$(this).qtDecrement(' + index + ')'
                                    }).append(
                                        $('<i>', { class: 'fa fa-minus' })
                                    )
                                ),
                                $('<input>', {
                                    class: 'form-control',
                                    type: 'number',
                                    value: data.quantity,
                                    onInput: '$(this).qtInput(' + index + ')'
                                }),
                                $('<div>', { class: 'input-group-btn btn-xs' }).append(
                                    $('<button>', {
                                        class: 'btn btn-default btn-xs',
                                        onclick: '$(this).qtIncrement(' + index + ')'
                                    }).append(
                                        $('<i>', { class: 'fa fa-plus' })
                                    )
                                )
                            )
                        ),
                        $('<td>', { text: settings.symbol + (data.price * data.quantity).toFixed(2) }),
                        $('<td>').append(
                            $('<button>', {
                                class: 'btn btn-danger btn-xs',
                                onclick: '$(this).deleteFromCart(' + index + ')'
                            }).append(
                                $('<i>', { class: 'fa fa-times' })
                            )
                        )
                    )
                )
            })
        };


        $.fn.deleteFromCart = function (index) {
            cart.splice(index, 1);
            $(this).renderTable(cart);

        }


        $.fn.qtIncrement = function (i) {

            item = cart[i];

            let product = allProducts.filter(function (selected) {
                return selected._id == parseInt(item.id);
            });

            if (product[0].stock == 1) {
                if (item.quantity < product[0].quantity) {
                    item.quantity += 1;
                    $(this).renderTable(cart);
                }

                else {
                    Swal.fire(
                        'No more stock!',
                        'You have already added all the available stock.',
                        'info'
                    );
                }
            }
            else {
                item.quantity += 1;
                $(this).renderTable(cart);
            }

        }


        $.fn.qtDecrement = function (i) {
            if (item.quantity > 1) {
                item = cart[i];
                item.quantity -= 1;
                $(this).renderTable(cart);
            }
        }


        $.fn.qtInput = function (i) {
            item = cart[i];
            item.quantity = $(this).val();
            $(this).renderTable(cart);
        }


        $.fn.cancelOrder = function () {

            if (cart.length > 0) {
                Swal.fire({
                    title: 'Are you sure?',
                    text: "You are about to remove all items from the cart.",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#E43A19',
                    cancelButtonColor: '#111F4D',
                    confirmButtonText: 'Yes, clear it!'
                }).then((result) => {

                    if (result.value) {

                        cart = [];
                        $(this).renderTable(cart);
                        holdOrder = 0;

                        Swal.fire(
                            'Cleared!',
                            'All items have been removed.',
                            'success'
                        )
                    }
                });
            }

        }


        $("#payButton").on('click', function () {
            if (cart.length != 0) {
                $("#paymentModel").modal('toggle');
            } else {
                Swal.fire(
                    'Oops!',
                    'There is nothing to pay!',
                    'warning'
                );
            }

        });


        $("#hold").on('click', function () {

            if (cart.length != 0) {

                $("#dueModal").modal('toggle');
            } else {
                Swal.fire(
                    'Oops!',
                    'There is nothing to hold!',
                    'warning'
                );
            }
        });


        function printJobComplete() {
            alert("print job complete");
        }


        $.fn.submitDueOrder = function (status) {

            let items = "";
            let payment = 0;

            cart.forEach(item => {

                items += "<tr><td>" + item.product_name + "</td><td>" + item.quantity + "</td><td>" + settings.symbol + parseFloat(item.price).toFixed(2) + "</td></tr>";

            });

            let currentTime = new Date(moment());

            let discount = $("#inputDiscount").val();
            let customer = JSON.parse($("#customer").val());
            let date = moment(currentTime).format("YYYY-MM-DD HH:mm:ss");
            let paid = $("#payment").val() == "" ? "" : parseFloat($("#payment").val()).toFixed(2);
            let change = $("#change").text() == "" ? "" : parseFloat($("#change").text()).toFixed(2);
            let refNumber = $("#refNumber").val();
            let orderNumber = holdOrder;
            let type = "";
            let tax_row = "";


            switch (paymentType) {

                case 1: type = "Cheque";
                    break;

                case 2: type = "Card";
                    break;

                default: type = "Cash";

            }


            if (paid != "") {
                payment = `<tr>
                        <td>Paid</td>
                        <td>:</td>
                        <td>${settings.symbol + paid}</td>
                    </tr>
                    <tr>
                        <td>Change</td>
                        <td>:</td>
                        <td>${settings.symbol + Math.abs(change).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Method</td>
                        <td>:</td>
                        <td>${type}</td>
                    </tr>`
            }



            if (settings.charge_tax) {
                tax_row = `<tr>
                    <td>Vat(${settings.percentage})% </td>
                    <td>:</td>
                    <td>${settings.symbol}${parseFloat(totalVat).toFixed(2)}</td>
                </tr>`;
            }



            if (status == 0) {

                if ($("#customer").val() == 0 && $("#refNumber").val() == "") {
                    Swal.fire(
                        'Reference Required!',
                        'You either need to select a customer <br> or enter a reference!',
                        'warning'
                    )

                    return;
                }
            }


            $(".loading").show();


            if (holdOrder != 0) {

                orderNumber = holdOrder;
                method = 'PUT'
            }
            else {
                orderNumber = Math.floor(Date.now() / 1000);
                method = 'POST'
            }


            receipt = `<div style="font-size: 10px;">                            
        <p style="text-align: center;">
        ${settings.img == "" ? settings.img : '<img style="max-width: 50px;max-width: 100px;" src ="' + img_path + settings.img + '" /><br>'}
            <span style="font-size: 22px;">${settings.store}</span> <br>
            ${settings.address_one} <br>
            ${settings.address_two} <br>
            ${settings.contact != '' ? 'Tel: ' + settings.contact + '<br>' : ''} 
            ${settings.tax != '' ? 'Vat No: ' + settings.tax + '<br>' : ''} 
        </p>
        <hr>
        <left>
            <p>
            Order No : ${orderNumber} <br>
            Ref No : ${refNumber == "" ? orderNumber : refNumber} <br>
            Customer : ${customer == 0 ? 'Walk in customer' : customer.name} <br>
            Cashier : ${user.fullname} <br>
            Date : ${date}<br>
            </p>

        </left>
        <hr>
        <table width="100%">
            <thead style="text-align: left;">
            <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
            </tr>
            </thead>
            <tbody>
            ${items}                
     
            <tr>                        
                <td><b>Subtotal</b></td>
                <td>:</td>
                <td><b>${settings.symbol}${subTotal.toFixed(2)}</b></td>
            </tr>
            <tr>
                <td>Discount</td>
                <td>:</td>
                <td>${discount > 0 ? settings.symbol + parseFloat(discount).toFixed(2) : ''}</td>
            </tr>
            
            ${tax_row}
        
            <tr>
                <td><h3>Total</h3></td>
                <td><h3>:</h3></td>
                <td>
                    <h3>${settings.symbol}${parseFloat(orderTotal).toFixed(2)}</h3>
                </td>
            </tr>
            ${payment == 0 ? '' : payment}
            </tbody>
            </table>
            <br>
            <hr>
            <br>
            <p style="text-align: center;">
             ${settings.footer}
             </p>
            </div>`;


            if (status == 3) {
                if (cart.length > 0) {

                    printJS({ printable: receipt, type: 'raw-html' });

                    $(".loading").hide();
                    return;

                }
                else {

                    $(".loading").hide();
                    return;
                }
            }


            let data = {
                order: orderNumber,
                ref_number: refNumber,
                discount: discount,
                customer: customer,
                status: status,
                subtotal: parseFloat(subTotal).toFixed(2),
                tax: totalVat,
                order_type: 1,
                items: cart,
                date: currentTime,
                payment_type: type,
                payment_info: $("#paymentInfo").val(),
                total: orderTotal,
                paid: paid,
                change: change,
                _id: orderNumber,
                till: platform.till,
                mac: platform.mac,
                user: user.fullname,
                user_id: user._id
            }


            $.ajax({
                url: api + 'new',
                type: method,
                data: JSON.stringify(data),
                contentType: 'application/json; charset=utf-8',
                cache: false,
                processData: false,
                success: function (data) {

                    cart = [];
                    $('#viewTransaction').html('');
                    $('#viewTransaction').html(receipt);
                    $('#orderModal').modal('show');
                    loadProducts();
                    loadCustomers();
                    $(".loading").hide();
                    $("#dueModal").modal('hide');
                    $("#paymentModel").modal('hide');
                    $(this).getHoldOrders();
                    $(this).getCustomerOrders();
                    $(this).renderTable(cart);

                }, error: function (data) {
                    $(".loading").hide();
                    $("#dueModal").modal('toggle');
                    swal("Something went wrong!", 'Please refresh this page and try again');

                }
            });

            $("#refNumber").val('');
            $("#change").text('');
            $("#payment").val('');

        }


        $.get(api + 'on-hold', function (data) {
            holdOrderList = data;
            holdOrderlocation.empty();
            clearInterval(dotInterval);
            $(this).randerHoldOrders(holdOrderList, holdOrderlocation, 1);
        });


        $.fn.getHoldOrders = function () {
            $.get(api + 'on-hold', function (data) {
                holdOrderList = data;
                clearInterval(dotInterval);
                holdOrderlocation.empty();
                $(this).randerHoldOrders(holdOrderList, holdOrderlocation, 1);
            });
        };


        $.fn.randerHoldOrders = function (data, renderLocation, orderType) {
            $.each(data, function (index, order) {
                $(this).calculatePrice(order);
                renderLocation.append(
                    $('<div>', { class: orderType == 1 ? 'col-md-3 order' : 'col-md-3 customer-order' }).append(
                        $('<a>').append(
                            $('<div>', { class: 'card-box order-box' }).append(
                                $('<p>').append(
                                    $('<b>', { text: 'Ref :' }),
                                    $('<span>', { text: order.ref_number, class: 'ref_number' }),
                                    $('<br>'),
                                    $('<b>', { text: 'Price :' }),
                                    $('<span>', { text: order.total, class: "label label-info", style: 'font-size:14px;' }),
                                    $('<br>'),
                                    $('<b>', { text: 'Items :' }),
                                    $('<span>', { text: order.items.length }),
                                    $('<br>'),
                                    $('<b>', { text: 'Customer :' }),
                                    $('<span>', { text: order.customer != 0 ? order.customer.name : 'Walk in customer', class: 'customer_name' })
                                ),
                                $('<button>', { class: 'btn btn-danger del', onclick: '$(this).deleteOrder(' + index + ',' + orderType + ')' }).append(
                                    $('<i>', { class: 'fa fa-trash' })
                                ),

                                $('<button>', { class: 'btn btn-default', onclick: '$(this).orderDetails(' + index + ',' + orderType + ')' }).append(
                                    $('<span>', { class: 'fa fa-shopping-basket' })
                                )
                            )
                        )
                    )
                )
            })
        }


        $.fn.calculatePrice = function (data) {
            totalPrice = 0;
            $.each(data.products, function (index, product) {
                totalPrice += product.price * product.quantity;
            })

            let vat = (totalPrice * data.vat) / 100;
            totalPrice = ((totalPrice + vat) - data.discount).toFixed(0);

            return totalPrice;
        };


        $.fn.orderDetails = function (index, orderType) {

            $('#refNumber').val('');

            if (orderType == 1) {

                $('#refNumber').val(holdOrderList[index].ref_number);

                $("#customer option:selected").removeAttr('selected');

                $("#customer option").filter(function () {
                    return $(this).text() == "Walk in customer";
                }).prop("selected", true);

                holdOrder = holdOrderList[index]._id;
                cart = [];
                $.each(holdOrderList[index].items, function (index, product) {
                    item = {
                        id: product.id,
                        product_name: product.product_name,
                        sku: product.sku,
                        price: product.price,
                        quantity: product.quantity
                    };
                    cart.push(item);
                })
            } else if (orderType == 2) {

                $('#refNumber').val('');

                $("#customer option:selected").removeAttr('selected');

                $("#customer option").filter(function () {
                    return $(this).text() == customerOrderList[index].customer.name;
                }).prop("selected", true);


                holdOrder = customerOrderList[index]._id;
                cart = [];
                $.each(customerOrderList[index].items, function (index, product) {
                    item = {
                        id: product.id,
                        product_name: product.product_name,
                        sku: product.sku,
                        price: product.price,
                        quantity: product.quantity
                    };
                    cart.push(item);
                })
            }
            $(this).renderTable(cart);
            $("#holdOrdersModal").modal('hide');
            $("#customerModal").modal('hide');
        }


        $.fn.deleteOrder = function (index, type) {

            switch (type) {
                case 1: deleteId = holdOrderList[index]._id;
                    break;
                case 2: deleteId = customerOrderList[index]._id;
            }

            let data = {
                orderId: deleteId,
            }

            Swal.fire({
                title: "Delete order?",
                text: "This will delete the order. Are you sure you want to delete!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#E43A19',
                cancelButtonColor: '#111F4D',
                confirmButtonText: 'Yes, delete it!'
            }).then((result) => {

                if (result.value) {

                    $.ajax({
                        url: api + 'delete',
                        type: 'POST',
                        data: JSON.stringify(data),
                        contentType: 'application/json; charset=utf-8',
                        cache: false,
                        success: function (data) {

                            $(this).getHoldOrders();
                            $(this).getCustomerOrders();

                            Swal.fire(
                                'Deleted!',
                                'You have deleted the order!',
                                'success'
                            )

                        }, error: function (data) {
                            $(".loading").hide();

                        }
                    });
                }
            });
        }



        $.fn.getCustomerOrders = function () {
            $.get(api + 'customer-orders', function (data) {
                clearInterval(dotInterval);
                customerOrderList = data;
                customerOrderLocation.empty();
                $(this).randerHoldOrders(customerOrderList, customerOrderLocation, 2);
            });
        }



        $('#saveCustomer').on('submit', function (e) {

            e.preventDefault();

            let custData = {
                _id: Math.floor(Date.now() / 1000),
                name: $('#userName').val(),
                phone: $('#phoneNumber').val(),
                email: $('#emailAddress').val(),
                address: $('#userAddress').val()
            }

            $.ajax({
                url: api + 'customers/customer',
                type: 'POST',
                data: JSON.stringify(custData),
                contentType: 'application/json; charset=utf-8',
                cache: false,
                processData: false,
                success: function (data) {
                    $("#newCustomer").modal('hide');
                    Swal.fire("Customer added!", "Customer added successfully!", "success");
                    $("#customer option:selected").removeAttr('selected');
                    $('#customer').append(
                        $('<option>', { text: custData.name, value: `{"id": ${custData._id}, "name": ${custData.name}}`, selected: 'selected' })
                    );

                    $('#customer').val(`{"id": ${custData._id}, "name": ${custData.name}}`).trigger('chosen:updated');

                }, error: function (data) {
                    $("#newCustomer").modal('hide');
                    Swal.fire('Error', 'Something went wrong please try again', 'error')
                }
            })
        })


        $("#confirmPayment").hide();

        $("#cardInfo").hide();

        $("#payment").on('input', function () {
            $(this).calculateChange();
        });


        $("#confirmPayment").on('click', function () {
            if ($('#payment').val() == "") {
                Swal.fire(
                    'Nope!',
                    'Please enter the amount that was paid!',
                    'warning'
                );
            }
            else {
                $(this).submitDueOrder(1);
            }
        });


        $('#transactions').click(function () {
            loadTransactions();
            loadUserList();

            $('#pos_view').hide();
            $('#pointofsale').show();
            $('#transactions_view').show();
            $(this).hide();

        });


        $('#pointofsale').click(function () {
            $('#pos_view').show();
            $('#transactions').show();
            $('#transactions_view').hide();
            $(this).hide();
        });


        $("#viewRefOrders").click(function () {
            setTimeout(function () {
                $("#holdOrderInput").focus();
            }, 500);
        });


        $("#viewCustomerOrders").click(function () {
            setTimeout(function () {
                $("#holdCustomerOrderInput").focus();
            }, 500);
        });


        $('#newProductModal').click(function () {
            $('#saveProduct').get(0).reset();
            $('#current_img').text('');
        });


        $('#saveProduct').submit(function (e) {
            e.preventDefault();

            $(this).attr('action', api + 'inventory/product');
            $(this).attr('method', 'POST');

            $(this).ajaxSubmit({
                contentType: 'application/json',
                success: function (response) {

                    $('#saveProduct').get(0).reset();
                    $('#current_img').text('');

                    loadProducts();
                    Swal.fire({
                        title: 'Product Saved',
                        text: "Select an option below to continue.",
                        icon: 'success',
                        showCancelButton: true,
                        confirmButtonColor: '#E43A19',
                        cancelButtonColor: '#111F4D',
                        confirmButtonText: 'Add another',
                        cancelButtonText: 'Close'
                    }).then((result) => {

                        if (!result.value) {
                            $("#newProduct").modal('hide');
                        }
                    });
                }, error: function (data) {
                    console.log(data);
                }
            });

        });



        $('#saveCategory').submit(function (e) {
            e.preventDefault();

            if ($('#category_id').val() == "") {
                method = 'POST';
            }
            else {
                method = 'PUT';
            }

            $.ajax({
                type: method,
                url: api + 'categories/category',
                data: $(this).serialize(),
                success: function (data, textStatus, jqXHR) {
                    $('#saveCategory').get(0).reset();
                    loadCategories();
                    loadProducts();
                    Swal.fire({
                        title: 'Category Saved',
                        text: "Select an option below to continue.",
                        icon: 'success',
                        showCancelButton: true,
                        confirmButtonColor: '#E43A19',
                        cancelButtonColor: '#111F4D',
                        confirmButtonText: 'Add another',
                        cancelButtonText: 'Close'
                    }).then((result) => {

                        if (!result.value) {
                            $("#newCategory").modal('hide');
                        }
                    });
                }, error: function (data) {
                    console.log(data);
                }

            });


        });


        $.fn.editProduct = function (index) {

            $('#Products').modal('hide');

            $("#category option").filter(function () {
                return $(this).val() == allProducts[index].category;
            }).prop("selected", true);

            $('#productName').val(allProducts[index].name);
            $('#product_price').val(allProducts[index].price);
            $('#quantity').val(allProducts[index].quantity);

            $('#product_id').val(allProducts[index]._id);
            $('#img').val(allProducts[index].img);

            if (allProducts[index].img != "") {

                $('#imagename').hide();
                $('#current_img').html(`<img src="${img_path + allProducts[index].img}" alt="">`);
                $('#rmv_img').show();
            }

            if (allProducts[index].stock == 0) {
                $('#stock').prop("checked", true);
            }

            $('#newProduct').modal('show');
        }


        $("#userModal").on("hide.bs.modal", function () {
            $('.perms').hide();
        });


        $.fn.editUser = function (index) {

            user_index = index;

            $('#Users').modal('hide');

            $('.perms').show();

            $("#user_id").val(allUsers[index]._id);
            $('#fullname').val(allUsers[index].fullname);
            $('#username').val(allUsers[index].username);
            $('#password').val(atob(allUsers[index].password));

            if (allUsers[index].perm_products == 1) {
                $('#perm_products').prop("checked", true);
            }
            else {
                $('#perm_products').prop("checked", false);
            }

            if (allUsers[index].perm_categories == 1) {
                $('#perm_categories').prop("checked", true);
            }
            else {
                $('#perm_categories').prop("checked", false);
            }

            if (allUsers[index].perm_transactions == 1) {
                $('#perm_transactions').prop("checked", true);
            }
            else {
                $('#perm_transactions').prop("checked", false);
            }

            if (allUsers[index].perm_users == 1) {
                $('#perm_users').prop("checked", true);
            }
            else {
                $('#perm_users').prop("checked", false);
            }

            if (allUsers[index].perm_settings == 1) {
                $('#perm_settings').prop("checked", true);
            }
            else {
                $('#perm_settings').prop("checked", false);
            }

            $('#userModal').modal('show');
        }


        $.fn.editCategory = function (index) {
            $('#Categories').modal('hide');
            $('#categoryName').val(allCategories[index].name);
            $('#category_id').val(allCategories[index]._id);
            $('#newCategory').modal('show');
        }


        $.fn.deleteProduct = function (id) {
            Swal.fire({
                title: 'Are you sure?',
                text: "You are about to delete this product.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#E43A19',
                cancelButtonColor: '#111F4D',
                confirmButtonText: 'Yes, delete it!'
            }).then((result) => {

                if (result.value) {

                    $.ajax({
                        url: api + 'inventory/product/' + id,
                        type: 'DELETE',
                        success: function (result) {
                            loadProducts();
                            Swal.fire(
                                'Done!',
                                'Product deleted',
                                'success'
                            );

                        }
                    });
                }
            });
        }


        $.fn.deleteUser = function (id) {
            Swal.fire({
                title: 'Are you sure?',
                text: "You are about to delete this user.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#E43A19',
                cancelButtonColor: '#111F4D',
                confirmButtonText: 'Yes, delete!'
            }).then((result) => {

                if (result.value) {

                    $.ajax({
                        url: api + 'users/user/' + id,
                        type: 'DELETE',
                        success: function (result) {
                            loadUserList();
                            Swal.fire(
                                'Done!',
                                'User deleted',
                                'success'
                            );

                        }
                    });
                }
            });
        }


        $.fn.deleteCategory = function (id) {
            Swal.fire({
                title: 'Are you sure?',
                text: "You are about to delete this category.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#E43A19',
                cancelButtonColor: '#111F4D',
                confirmButtonText: 'Yes, delete it!'
            }).then((result) => {

                if (result.value) {

                    $.ajax({
                        url: api + 'categories/category/' + id,
                        type: 'DELETE',
                        success: function (result) {
                            loadCategories();
                            Swal.fire(
                                'Done!',
                                'Category deleted',
                                'success'
                            );

                        }
                    });
                }
            });
        }


        $('#productModal').click(function () {
            loadProductList();
        });


        $('#usersModal').click(function () {
            loadUserList();
        });


        $('#categoryModal').click(function () {
            loadCategoryList();
        });


        function loadUserList() {

            let counter = 0;
            let user_list = '';
            $('#user_list').empty();
            $('#userList').DataTable().destroy();

            $.get(api + 'users/all', function (users) {



                allUsers = [...users];

                users.forEach((user, index) => {

                    state = [];
                    let class_name = '';

                    if (user.status != "") {
                        state = user.status.split("_");

                        switch (state[0]) {
                            case 'Logged In': class_name = 'btn-default';
                                break;
                            case 'Logged Out': class_name = 'btn-light';
                                break;
                        }
                    }

                    counter++;
                    user_list += `<tr>
            <td>${user.fullname}</td>
            <td>${user.username}</td>
            <td class="${class_name}">${state.length > 0 ? state[0] : ''} <br><span style="font-size: 11px;"> ${state.length > 0 ? moment(state[1]).format('hh:mm A DD MMM YYYY') : ''}</span></td>
            <td>${user._id == 1 ? '<span class="btn-group"><button class="btn btn-dark"><i class="fa fa-edit"></i></button><button class="btn btn-dark"><i class="fa fa-trash"></i></button></span>' : '<span class="btn-group"><button onClick="$(this).editUser(' + index + ')" class="btn btn-warning"><i class="fa fa-edit"></i></button><button onClick="$(this).deleteUser(' + user._id + ')" class="btn btn-danger"><i class="fa fa-trash"></i></button></span>'}</td></tr>`;

                    if (counter == users.length) {

                        $('#user_list').html(user_list);

                        $('#userList').DataTable({
                            "order": [[1, "desc"]]
                            , "autoWidth": false
                            , "info": true
                            , "JQueryUI": true
                            , "ordering": true
                            , "paging": false
                        });
                    }

                });

            });
        }


        function loadProductList() {
            let products = [...allProducts];
            let product_list = '';
            let counter = 0;
            $('#product_list').empty();
            $('#productList').DataTable().destroy();

            products.forEach((product, index) => {

                counter++;

                let category = allCategories.filter(function (category) {
                    return category._id == product.category;
                });


                product_list += `<tr>
            <td><img id="`+ product._id + `"></td>
            <td><img style="max-height: 50px; max-width: 50px; border: 1px solid #ddd;" src="${product.img == "" ? "./assets/images/default.jpg" : img_path + product.img}" id="product_img"></td>
            <td>${product.name}</td>
            <td>${settings.symbol}${product.price}</td>
            <td>${product.stock == 1 ? product.quantity : 'N/A'}</td>
            <td>${category.length > 0 ? category[0].name : ''}</td>
            <td class="nobr"><span class="btn-group"><button onClick="$(this).editProduct(${index})" class="btn btn-warning btn-sm"><i class="fa fa-edit"></i></button><button onClick="$(this).deleteProduct(${product._id})" class="btn btn-danger btn-sm"><i class="fa fa-trash"></i></button></span></td></tr>`;

                if (counter == allProducts.length) {

                    $('#product_list').html(product_list);

                    products.forEach(pro => {
                        $("#" + pro._id + "").JsBarcode(pro._id, {
                            width: 2,
                            height: 25,
                            fontSize: 14
                        });
                    });

                    $('#productList').DataTable({
                        "order": [[1, "desc"]]
                        , "autoWidth": false
                        , "info": true
                        , "JQueryUI": true
                        , "ordering": true
                        , "paging": false
                    });
                }

            });
        }


        function loadCategoryList() {

            let category_list = '';
            let counter = 0;
            $('#category_list').empty();
            $('#categoryList').DataTable().destroy();

            allCategories.forEach((category, index) => {

                counter++;

                category_list += `<tr>
     
            <td>${category.name}</td>
            <td><span class="btn-group"><button onClick="$(this).editCategory(${index})" class="btn btn-warning"><i class="fa fa-edit"></i></button><button onClick="$(this).deleteCategory(${category._id})" class="btn btn-danger"><i class="fa fa-trash"></i></button></span></td></tr>`;
            });

            if (counter == allCategories.length) {

                $('#category_list').html(category_list);
                $('#categoryList').DataTable({
                    "autoWidth": false
                    , "info": true
                    , "JQueryUI": true
                    , "ordering": true
                    , "paging": false

                });
            }
        }


        $.fn.serializeObject = function () {
            var o = {};
            var a = this.serializeArray();
            $.each(a, function () {
                if (o[this.name]) {
                    if (!o[this.name].push) {
                        o[this.name] = [o[this.name]];
                    }
                    o[this.name].push(this.value || '');
                } else {
                    o[this.name] = this.value || '';
                }
            });
            return o;
        };



        $('#log-out').click(function () {

            Swal.fire({
                title: 'Are you sure?',
                text: "You are about to log out.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#E43A19',
                cancelButtonColor: '#111F4D',
                confirmButtonText: 'Logout'
            }).then((result) => {

                if (result.value) {
                    $.get(api + 'users/logout/' + user._id, function (data) {
                        storage.delete('auth');
                        storage.delete('user');
                        ipcRenderer.send('app-reload', '');
                    });
                }
            });
        });



        $('#settings_form').on('submit', function (e) {
            e.preventDefault();
            let formData = $(this).serializeObject();
            let mac_address;

            api = 'http://' + host + ':' + port + '/api/';

            macaddress.one(function (err, mac) {
                mac_address = mac;
            });

            formData['app'] = $('#app').find('option:selected').text();
            formData['mac'] = mac_address;
            formData['till'] = 1;

            $('#settings_form').append('<input type="hidden" name="app" value="' + formData.app + '" />');

            if (formData.percentage != "" && !$.isNumeric(formData.percentage)) {
                Swal.fire(
                    'Oops!',
                    'Please make sure the tax value is a number',
                    'warning'
                );
            }
            else {
                storage.set('settings', formData);

                $(this).attr('action', api + 'settings/post');
                $(this).attr('method', 'POST');


                $(this).ajaxSubmit({
                    contentType: 'application/json',
                    success: function (response) {

                        ipcRenderer.send('app-reload', '');

                    }, error: function (data) {
                        console.log(data);
                    }

                });

            }

        });



        $('#net_settings_form').on('submit', function (e) {
            e.preventDefault();
            let formData = $(this).serializeObject();

            if (formData.till == 0 || formData.till == 1) {
                Swal.fire(
                    'Oops!',
                    'Please enter a number greater than 1.',
                    'warning'
                );
            }
            else {
                if (isNumeric(formData.till)) {
                    formData['app'] = $('#app').find('option:selected').text();
                    storage.set('settings', formData);
                    ipcRenderer.send('app-reload', '');
                }
                else {
                    Swal.fire(
                        'Oops!',
                        'Till number must be a number!',
                        'warning'
                    );
                }

            }

        });



        $('#saveUser').on('submit', function (e) {
            e.preventDefault();
            let formData = $(this).serializeObject();

            console.log(formData);

            if (ownUserEdit) {
                if (formData.password != atob(user.password)) {
                    if (formData.password != formData.pass) {
                        Swal.fire(
                            'Oops!',
                            'Passwords do not match!',
                            'warning'
                        );
                    }
                }
            }
            else {
                if (formData.password != atob(allUsers[user_index].password)) {
                    if (formData.password != formData.pass) {
                        Swal.fire(
                            'Oops!',
                            'Passwords do not match!',
                            'warning'
                        );
                    }
                }
            }



            if (formData.password == atob(user.password) || formData.password == atob(allUsers[user_index].password) || formData.password == formData.pass) {
                $.ajax({
                    url: api + 'users/post',
                    type: 'POST',
                    data: JSON.stringify(formData),
                    contentType: 'application/json; charset=utf-8',
                    cache: false,
                    processData: false,
                    success: function (data) {

                        if (ownUserEdit) {
                            ipcRenderer.send('app-reload', '');
                        }

                        else {
                            $('#userModal').modal('hide');

                            loadUserList();

                            $('#Users').modal('show');
                            Swal.fire(
                                'Ok!',
                                'User details saved!',
                                'success'
                            );
                        }


                    }, error: function (data) {
                        console.log(data);
                    }

                });

            }

        });



        $('#app').change(function () {
            if ($(this).find('option:selected').text() == 'Network Point of Sale Terminal') {
                $('#net_settings_form').show(500);
                $('#settings_form').hide(500);
                macaddress.one(function (err, mac) {
                    $("#mac").val(mac);
                });
            }
            else {
                $('#net_settings_form').hide(500);
                $('#settings_form').show(500);
            }

        });



        $('#cashier').click(function () {

            ownUserEdit = true;

            $('#userModal').modal('show');

            $("#user_id").val(user._id);
            $("#fullname").val(user.fullname);
            $("#username").val(user.username);
            $("#password").val(atob(user.password));

        });



        $('#add-user').click(function () {

            if (platform.app != 'Network Point of Sale Terminal') {
                $('.perms').show();
            }

            $("#saveUser").get(0).reset();
            $('#userModal').modal('show');

        });



        $('#settings').click(function () {

            if (platform.app == 'Network Point of Sale Terminal') {
                $('#net_settings_form').show(500);
                $('#settings_form').hide(500);

                $("#ip").val(platform.ip);
                $("#till").val(platform.till);

                macaddress.one(function (err, mac) {
                    $("#mac").val(mac);
                });

                $("#app option").filter(function () {
                    return $(this).text() == platform.app;
                }).prop("selected", true);
            }
            else {
                $('#net_settings_form').hide(500);
                $('#settings_form').show(500);

                $("#settings_id").val("1");
                $("#store").val(settings.store);
                $("#address_one").val(settings.address_one);
                $("#address_two").val(settings.address_two);
                $("#contact").val(settings.contact);
                $("#tax").val(settings.tax);
                $("#symbol").val(settings.symbol);
                $("#percentage").val(settings.percentage);
                $("#footer").val(settings.footer);
                $("#logo_img").val(settings.img);
                if (settings.charge_tax == 'on') {
                    $('#charge_tax').prop("checked", true);
                }
                if (settings.img != "") {
                    $('#logoname').hide();
                    $('#current_logo').html(`<img src="${img_path + settings.img}" alt="">`);
                    $('#rmv_logo').show();
                }

                $("#app option").filter(function () {
                    return $(this).text() == settings.app;
                }).prop("selected", true);
            }




        });


    });


    $('#rmv_logo').click(function () {
        $('#remove_logo').val("1");
        $('#current_logo').hide(500);
        $(this).hide(500);
        $('#logoname').show(500);
    });


    $('#rmv_img').click(function () {
        $('#remove_img').val("1");
        $('#current_img').hide(500);
        $(this).hide(500);
        $('#imagename').show(500);
    });


    $('#print_list').click(function () {

        $("#loading").show();

        $('#productList').DataTable().destroy();

        const filename = 'productList.pdf';

        html2canvas($('#all_products').get(0)).then(canvas => {
            let height = canvas.height * (25.4 / 96);
            let width = canvas.width * (25.4 / 96);
            let pdf = new jsPDF('p', 'mm', 'a4');
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, width, height);

            $("#loading").hide();
            pdf.save(filename);
        });



        $('#productList').DataTable({
            "order": [[1, "desc"]]
            , "autoWidth": false
            , "info": true
            , "JQueryUI": true
            , "ordering": true
            , "paging": false
        });

        $(".loading").hide();

    });

}


$.fn.print = function () {

    printJS({ printable: receipt, type: 'raw-html' });

}


function loadTransactions() {

    let tills = [];
    let users = [];
    let sales = 0;
    let transact = 0;
    let unique = 0;

    sold_items = [];
    sold = [];

    let counter = 0;
    let transaction_list = '';
    let query = `by-date?start=${start_date}&end=${end_date}&user=${by_user}&status=${by_status}&till=${by_till}`;


    $.get(api + query, function (transactions) {

        if (transactions.length > 0) {


            $('#transaction_list').empty();
            $('#transactionList').DataTable().destroy();

            allTransactions = [...transactions];

            transactions.forEach((trans, index) => {

                sales += parseFloat(trans.total);
                transact++;



                trans.items.forEach(item => {
                    sold_items.push(item);
                });


                if (!tills.includes(trans.till)) {
                    tills.push(trans.till);
                }

                if (!users.includes(trans.user_id)) {
                    users.push(trans.user_id);
                }

                counter++;
                transaction_list += `<tr>
                                <td>${trans.order}</td>
                                <td class="nobr">${moment(trans.date).format('YYYY MMM DD hh:mm:ss')}</td>
                                <td>${settings.symbol + trans.total}</td>
                                <td>${trans.paid == "" ? "" : settings.symbol + trans.paid}</td>
                                <td>${trans.change ? settings.symbol + Math.abs(trans.change).toFixed(2) : ''}</td>
                                <td>${trans.paid == "" ? "" : trans.payment_type == 0 ? "Cash" : 'Card'}</td>
                                <td>${trans.till}</td>
                                <td>${trans.user}</td>
                                <td>${trans.paid == "" ? '<button class="btn btn-dark"><i class="fa fa-search-plus"></i></button>' : '<button onClick="$(this).viewTransaction(' + index + ')" class="btn btn-info"><i class="fa fa-search-plus"></i></button></td>'}</tr>
                    `;

                if (counter == transactions.length) {

                    $('#total_sales #counter').text(settings.symbol + parseFloat(sales).toFixed(2));
                    $('#total_transactions #counter').text(transact);

                    const result = {};

                    for (const { product_name, price, quantity, id } of sold_items) {
                        if (!result[product_name]) result[product_name] = [];
                        result[product_name].push({ id, price, quantity });
                    }

                    for (item in result) {

                        let price = 0;
                        let quantity = 0;
                        let id = 0;

                        result[item].forEach(i => {
                            id = i.id;
                            price = i.price;
                            quantity += i.quantity;
                        });

                        sold.push({
                            id: id,
                            product: item,
                            qty: quantity,
                            price: price
                        });
                    }

                    loadSoldProducts();


                    if (by_user == 0 && by_till == 0) {

                        userFilter(users);
                        tillFilter(tills);
                    }


                    $('#transaction_list').html(transaction_list);
                    $('#transactionList').DataTable({
                        "order": [[1, "desc"]]
                        , "autoWidth": false
                        , "info": true
                        , "JQueryUI": true
                        , "ordering": true
                        , "paging": true,
                        "dom": 'Bfrtip',
                        "buttons": ['csv', 'excel', 'pdf',]

                    });
                }
            });
        }
        else {
            Swal.fire(
                'No data!',
                'No transactions available within the selected criteria',
                'warning'
            );
        }

    });
}


function discend(a, b) {
    if (a.qty > b.qty) {
        return -1;
    }
    if (a.qty < b.qty) {
        return 1;
    }
    return 0;
}


function loadSoldProducts() {

    sold.sort(discend);

    let counter = 0;
    let sold_list = '';
    let items = 0;
    let products = 0;
    $('#product_sales').empty();

    sold.forEach((item, index) => {

        items += item.qty;
        products++;

        let product = allProducts.filter(function (selected) {
            return selected._id == item.id;
        });

        counter++;

        sold_list += `<tr>
            <td>${item.product}</td>
            <td>${item.qty}</td>
            <td>${product[0].stock == 1 ? product.length > 0 ? product[0].quantity : '' : 'N/A'}</td>
            <td>${settings.symbol + (item.qty * parseFloat(item.price)).toFixed(2)}</td>
            </tr>`;

        if (counter == sold.length) {
            $('#total_items #counter').text(items);
            $('#total_products #counter').text(products);
            $('#product_sales').html(sold_list);
        }
    });
}


function userFilter(users) {

    $('#users').empty();
    $('#users').append(`<option value="0">All</option>`);

    users.forEach(user => {
        let u = allUsers.filter(function (usr) {
            return usr._id == user;
        });

        $('#users').append(`<option value="${user}">${u[0].fullname}</option>`);
    });

}


function tillFilter(tills) {

    $('#tills').empty();
    $('#tills').append(`<option value="0">All</option>`);
    tills.forEach(till => {
        $('#tills').append(`<option value="${till}">${till}</option>`);
    });

}


$.fn.viewTransaction = function (index) {

    transaction_index = index;

    let discount = allTransactions[index].discount;
    let customer = allTransactions[index].customer == 0 ? 'Walk in Customer' : allTransactions[index].customer.username;
    let refNumber = allTransactions[index].ref_number != "" ? allTransactions[index].ref_number : allTransactions[index].order;
    let orderNumber = allTransactions[index].order;
    let type = "";
    let tax_row = "";
    let items = "";
    let products = allTransactions[index].items;

    products.forEach(item => {
        items += "<tr><td>" + item.product_name + "</td><td>" + item.quantity + "</td><td>" + settings.symbol + parseFloat(item.price).toFixed(2) + "</td></tr>";

    });


    switch (allTransactions[index].payment_type) {

        case 2: type = "Card";
            break;

        default: type = "Cash";

    }


    if (allTransactions[index].paid != "") {
        payment = `<tr>
                    <td>Paid</td>
                    <td>:</td>
                    <td>${settings.symbol + allTransactions[index].paid}</td>
                </tr>
                <tr>
                    <td>Change</td>
                    <td>:</td>
                    <td>${settings.symbol + Math.abs(allTransactions[index].change).toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Method</td>
                    <td>:</td>
                    <td>${type}</td>
                </tr>`
    }



    if (settings.charge_tax) {
        tax_row = `<tr>
                <td>Vat(${settings.percentage})% </td>
                <td>:</td>
                <td>${settings.symbol}${parseFloat(allTransactions[index].tax).toFixed(2)}</td>
            </tr>`;
    }



    receipt = `<div style="font-size: 10px;">                            
        <p style="text-align: center;">
        ${settings.img == "" ? settings.img : '<img style="max-width: 50px;max-width: 100px;" src ="' + img_path + settings.img + '" /><br>'}
            <span style="font-size: 22px;">${settings.store}</span> <br>
            ${settings.address_one} <br>
            ${settings.address_two} <br>
            ${settings.contact != '' ? 'Tel: ' + settings.contact + '<br>' : ''} 
            ${settings.tax != '' ? 'Vat No: ' + settings.tax + '<br>' : ''} 
    </p>
    <hr>
    <left>
        <p>
        Invoice : ${orderNumber} <br>
        Ref No : ${refNumber} <br>
        Customer : ${allTransactions[index].customer == 0 ? 'Walk in Customer' : allTransactions[index].customer.name} <br>
        Cashier : ${allTransactions[index].user} <br>
        Date : ${moment(allTransactions[index].date).format('DD MMM YYYY HH:mm:ss')}<br>
        </p>

    </left>
    <hr>
    <table width="100%">
        <thead style="text-align: left;">
        <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
        </tr>
        </thead>
        <tbody>
        ${items}                
 
        <tr>                        
            <td><b>Subtotal</b></td>
            <td>:</td>
            <td><b>${settings.symbol}${allTransactions[index].subtotal}</b></td>
        </tr>
        <tr>
            <td>Discount</td>
            <td>:</td>
            <td>${discount > 0 ? settings.symbol + parseFloat(allTransactions[index].discount).toFixed(2) : ''}</td>
        </tr>
        
        ${tax_row}
    
        <tr>
            <td><h3>Total</h3></td>
            <td><h3>:</h3></td>
            <td>
                <h3>${settings.symbol}${allTransactions[index].total}</h3>
            </td>
        </tr>
        ${payment == 0 ? '' : payment}
        </tbody>
        </table>
        <br>
        <hr>
        <br>
        <p style="text-align: center;">
         ${settings.footer}
         </p>
        </div>`;

    $('#viewTransaction').html('');
    $('#viewTransaction').html(receipt);

    $('#orderModal').modal('show');

}


$('#status').change(function () {
    by_status = $(this).find('option:selected').val();
    loadTransactions();
});



$('#tills').change(function () {
    by_till = $(this).find('option:selected').val();
    loadTransactions();
});


$('#users').change(function () {
    by_user = $(this).find('option:selected').val();
    loadTransactions();
});


$('#reportrange').on('apply.daterangepicker', function (ev, picker) {

    start = picker.startDate.format('DD MMM YYYY hh:mm A');
    end = picker.endDate.format('DD MMM YYYY hh:mm A');

    start_date = picker.startDate.toDate().toJSON();
    end_date = picker.endDate.toDate().toJSON();


    loadTransactions();
});


function authenticate() {
    $('#loading').append(
        `<div style="background-color: white;display:flex;justify-content:center;align-items:center;flex-direction:column">
            <div id="load">
                <span class="form-group" style="display:flex; justify-content:center; align-items:center;">
                    <svg width="100px" height="100px" viewBox="0 0 256 230" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid">
                    <path d="M0.754124112,114.750341 C0.754124112,133.964682 19.5166032,151.90205 49.0972,162.012525 C43.1902309,191.75023 48.0385672,215.718618 64.2325395,225.058104 C80.878267,234.657205 105.676296,228.01262 129.212992,207.438816 C152.155865,227.182074 175.343729,234.952033 191.522612,225.586005 C208.152063,215.959037 213.210383,190.365003 207.140052,159.699094 C237.94981,149.512664 255.183937,134.217604 255.183937,114.750341 C255.183937,95.9814665 236.386646,79.743862 207.205024,69.6979922 C213.73997,37.7647117 208.20272,14.3779364 191.338416,4.65275505 C175.079459,-4.72292197 151.622419,3.44893641 128.342126,23.7092591 C104.122937,2.20452764 80.8973474,-4.36113675 64.049392,5.39238954 C47.8062377,14.7947358 43.1711096,39.1986962 49.0971999,69.4869405 C20.5154295,79.4522024 0.754124112,96.0565259 0.754124112,114.750341 Z" fill="#FFFFFF"></path>
                    <path d="M201.024553,79.6741178 C198.680534,78.8673056 196.251651,78.1039308 193.750774,77.3819828 C194.161823,75.7044085 194.539085,74.048553 194.87452,72.4208515 C200.380632,45.6934862 196.780544,24.1617345 184.487315,17.0725656 C172.699651,10.2749914 153.421826,17.3625515 133.952151,34.3064132 C132.079912,35.9357235 130.202444,37.6607573 128.325782,39.4686441 C127.075343,38.2725027 125.826916,37.1165813 124.581707,36.0109348 C104.176918,17.8934548 83.7242671,10.2585012 71.4431045,17.3681823 C59.6667022,24.1854643 56.1792302,44.4273621 61.135535,69.7570841 C61.6141524,72.2036638 62.1736119,74.7021273 62.8062718,77.2424195 C59.9116418,78.0641131 57.1171595,78.9401037 54.443337,79.872 C30.5209112,88.2124116 15.2429599,101.283896 15.2429599,114.842444 C15.2429599,128.845826 31.6438523,142.891438 56.5609175,151.408012 C58.527271,152.080088 60.5676292,152.715563 62.6703284,153.318862 C61.9877958,156.066288 61.3941493,158.758611 60.895824,161.384572 C56.1699796,186.27469 59.8605624,206.038372 71.6055931,212.812619 C83.7371375,219.808478 104.097282,212.617552 123.922903,195.287579 C125.489873,193.917687 127.062473,192.464943 128.637888,190.942216 C130.679856,192.908569 132.718604,194.769546 134.746495,196.515092 C153.949914,213.040264 172.916437,219.713157 184.650608,212.920007 C196.770086,205.904037 200.708827,184.673131 195.595261,158.842269 C195.204725,156.86948 194.75024,154.854058 194.239849,152.802841 C195.669668,152.380128 197.073345,151.943742 198.44203,151.490061 C224.345691,142.907526 241.199459,129.032848 241.199459,114.842444 C241.199459,101.234828 225.428813,88.0752616 201.024553,79.6741178 L201.024553,79.6741178 L201.024553,79.6741178 Z" fill="#53C1DE"></path>
                    <path d="M195.406228,142.327554 C194.170671,142.73659 192.902938,143.131953 191.611073,143.515249 C188.751435,134.46214 184.891928,124.835494 180.168899,114.889502 C184.675947,105.180405 188.386237,95.6768327 191.165838,86.6824446 C193.477279,87.3513024 195.720748,88.0567605 197.882571,88.8012318 C218.792119,95.9993967 231.546671,106.641998 231.546671,114.842444 C231.546671,123.577414 217.772142,134.916625 195.406228,142.327554 L195.406228,142.327554 L195.406228,142.327554 Z M186.125876,160.71692 C188.387041,172.138985 188.710007,182.46586 187.212216,190.538809 C185.866457,197.79288 183.160056,202.629329 179.813756,204.566322 C172.692813,208.688063 157.464736,203.330363 141.041722,189.197876 C139.159026,187.577816 137.262655,185.847956 135.360251,184.017143 C141.72707,177.053863 148.090269,168.958794 154.300632,159.968427 C165.223968,158.999127 175.544007,157.41446 184.902787,155.251029 C185.363708,157.110397 185.773147,158.93397 186.125876,160.71692 L186.125876,160.71692 L186.125876,160.71692 Z M92.2766379,203.854027 C85.3193904,206.311064 79.7782875,206.381449 76.4287698,204.450086 C69.301392,200.339205 66.3383881,184.470825 70.3800911,163.184817 C70.8430228,160.747085 71.3940362,158.242992 72.0291092,155.683394 C81.2853291,157.730187 91.5297533,159.203041 102.479233,160.090696 C108.731425,168.888007 115.278429,176.974228 121.87611,184.054548 C120.434627,185.446158 118.998774,186.771004 117.570966,188.019431 C108.804223,195.682539 100.018979,201.119472 92.2766379,203.854027 L92.2766379,203.854027 L92.2766379,203.854027 Z M59.6827903,142.274061 C48.6649364,138.508267 39.5659765,133.613901 33.3290683,128.273094 C27.7248202,123.473647 24.8953464,118.708789 24.8953464,114.842444 C24.8953464,106.614649 37.1620299,96.1200565 57.6207133,88.9870479 C60.1030888,88.1215145 62.7016999,87.3058539 65.3984478,86.5396638 C68.2259104,95.7371626 71.9349945,105.353351 76.4110731,115.077329 C71.8770778,124.945696 68.1153056,134.715124 65.2600911,144.020411 C63.3375774,143.467789 61.4749914,142.886209 59.6827903,142.274061 L59.6827903,142.274061 L59.6827903,142.274061 Z M70.6085405,67.9033464 C66.3621178,46.2014643 69.182341,29.8303347 76.2791516,25.7222687 C83.8384918,21.3459356 100.554306,27.585659 118.172255,43.2292097 C119.298413,44.2290778 120.428996,45.2756009 121.562797,46.3583221 C114.997694,53.4076732 108.510618,61.4331626 102.31393,70.1785891 C91.6870133,71.1635758 81.5145828,72.7458288 72.1618351,74.8646158 C71.5738193,72.4992804 71.0529709,70.1753716 70.6085405,67.9033464 L70.6085405,67.9033464 L70.6085405,67.9033464 Z M168.075965,91.970564 C165.840139,88.1086441 163.544785,84.3380235 161.204789,80.6703661 C168.414216,81.5817502 175.321589,82.7915664 181.808264,84.2720629 C179.860813,90.5133951 177.43354,97.0390825 174.576314,103.728867 C172.526706,99.8375868 170.35885,95.9141304 168.075965,91.970564 L168.075965,91.970564 L168.075965,91.970564 Z M128.328999,53.2568484 C132.781348,58.0804274 137.240132,63.465879 141.625716,69.3090337 C137.206347,69.1002922 132.732279,68.9916983 128.22121,68.9916983 C123.752773,68.9916983 119.311686,69.097879 114.919667,69.3030007 C119.309675,63.5141429 123.80707,58.1359308 128.328999,53.2568484 L128.328999,53.2568484 L128.328999,53.2568484 Z M88.3274407,92.0373291 C86.0940267,95.9101084 83.9663912,99.8122483 81.9489584,103.721628 C79.1379858,97.0551705 76.7332349,90.4997203 74.7688924,84.1699041 C81.2157486,82.7272144 88.0905452,81.5475633 95.254121,80.6534737 C92.8811438,84.3549159 90.5668876,88.1532883 88.3274407,92.0365247 L88.3274407,92.0373291 L88.3274407,92.0373291 Z M95.4604493,149.719981 C88.0591736,148.894265 81.0810118,147.775347 74.6357643,146.372474 C76.6314784,139.92964 79.0893197,133.234225 81.9598177,126.424182 C83.9824792,130.330746 86.1185609,134.234495 88.3656497,138.115721 L88.3660518,138.115721 C90.6549694,142.069744 93.0263378,145.942925 95.4604493,149.719981 L95.4604493,149.719981 L95.4604493,149.719981 Z M128.59606,177.108562 C124.02104,172.172367 119.457684,166.712107 115.000911,160.838787 C119.327371,161.008515 123.738293,161.095391 128.22121,161.095391 C132.826797,161.095391 137.379695,160.991623 141.861003,160.792132 C137.460939,166.771231 133.018244,172.239937 128.59606,177.108562 L128.59606,177.108562 L128.59606,177.108562 Z M174.668418,126.077084 C177.688534,132.960729 180.234457,139.621153 182.255912,145.954187 C175.704484,147.44876 168.631001,148.652544 161.178244,149.547036 C163.523872,145.829907 165.839334,141.994532 168.114576,138.049357 C170.416365,134.05793 172.601917,130.060469 174.668418,126.077084 L174.668418,126.077084 L174.668418,126.077084 Z M159.75325,133.226985 C156.221134,139.351277 152.594903,145.197649 148.913571,150.71623 C142.208502,151.195651 135.28142,151.442602 128.22121,151.442602 C121.189556,151.442602 114.34975,151.224207 107.763331,150.796669 C103.933587,145.205694 100.228525,139.342027 96.7189317,133.279673 L96.7197361,133.279673 C93.2193935,127.23381 89.9977754,121.136867 87.0786112,115.074112 C89.9969709,108.997279 93.2101429,102.893499 96.6903755,96.8584949 L96.6895711,96.8597015 C100.179054,90.8086096 103.851538,84.9734988 107.645888,79.4175145 C114.365838,78.9095366 121.256723,78.6444871 128.220808,78.6444871 L128.22121,78.6444871 C135.216666,78.6444871 142.116399,78.9115475 148.834337,79.4239498 C152.570771,84.9393119 156.218319,90.7555192 159.721477,96.8074156 C163.264453,102.927284 166.519051,108.990441 169.462347,114.936962 C166.5279,120.98564 163.280541,127.109933 159.75325,133.226985 L159.75325,133.226985 L159.75325,133.226985 Z M179.665747,25.4350982 C187.232327,29.7985609 190.174818,47.3963991 185.42082,70.472597 C185.117561,71.9450495 184.776095,73.4448515 184.405266,74.9647635 C175.030799,72.8017345 164.851129,71.192132 154.193245,70.1922639 C147.98449,61.3507117 141.550504,53.3127541 135.092386,46.3538978 C136.828682,44.6835633 138.562564,43.0908531 140.289206,41.5878335 C156.970834,27.0704415 172.562099,21.338696 179.665747,25.4350982 L179.665747,25.4350982 L179.665747,25.4350982 Z" fill="#FFFFFF"></path>
                    <path d="M128.22121,94.6653008 C139.36455,94.6653008 148.398353,103.698702 148.398353,114.842444 C148.398353,125.985784 139.36455,135.019589 128.22121,135.019589 C117.07787,135.019589 108.044066,125.985784 108.044066,114.842444 C108.044066,103.698702 117.07787,94.6653008 128.22121,94.6653008" fill="#53C1DE"></path>
                </svg>
                </span>
                <form id="account" class="form-group">
                    <div class="form-group">
                        <input type="text" placeholder="Username" name="username" class="form-control">
                    </div>
                    <div class="form-group">
                        <input type="password" placeholder="Password" name="password" class="form-control">
                    </div>
                    <div>
                        <input type="submit" style="background-color: #111F4D; width: 418px ; height: 38px; " value="Login to Dashboard">
                    </div>
                </form>
            </div>
        </div>`
    );
}


$('body').on("submit", "#account", function (e) {
    e.preventDefault();
    let formData = $(this).serializeObject();

    if (formData.username == "" || formData.password == "") {

        Swal.fire(
            'Incomplete form!',
            auth_empty,
            'warning'
        );
    }
    else {

        $.ajax({
            url: api + 'users/login',
            type: 'POST',
            data: JSON.stringify(formData),
            contentType: 'application/json; charset=utf-8',
            cache: false,
            processData: false,
            success: function (data) {
                if (data._id) {
                    storage.set('auth', { auth: true });
                    storage.set('user', data);
                    ipcRenderer.send('app-reload', '');
                }
                else {
                    Swal.fire(
                        'Oops!',
                        auth_error,
                        'warning'
                    );
                }

            }, error: function (data) {
                console.log(data);
            }
        });
    }
});


$('#quit').click(function () {
    Swal.fire({
        title: 'Are you sure?',
        text: "You are about to close the application.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#E43A19',
        cancelButtonColor: '#111F4D',
        confirmButtonText: 'Close Application'
    }).then((result) => {

        if (result.value) {
            ipcRenderer.send('app-quit', '');
        }
    });
});


