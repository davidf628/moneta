export function sort_months(months) {

    // define the proper order of months
    const month_order = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Sort using the monthOrder index
    const sorted = months.sort(
        (a, b) => month_order.indexOf(a) - month_order.indexOf(b)
    );

    return sorted;
}

// Takes a list of objects (returned from a database) such as:
// [ { name: 'dave', id: 1} , { name 'nick', id: 2 }, ... ] and 
// returns a list containing only the specified property, such as:
// [ 'dave', 'nick' ]
export function get_property_list (object_list, property) {
    let payload = [];
    object_list.forEach((item) => {
        payload.push(item[property]);
    });
    return payload;
}

export function lookup_by_id (object_list, id, property) {
    let value = null;
    object_list.forEach( (obj) => {
        if (obj.id == id) {
            value = obj[property];
        }
    });
    return value;
}