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


// looks through a list of objects that looks like: [ { name: ..., id: ...}]
// and you supply the property to look through (name, for instance)
// and the value you're looking for ('dave', perhaps) and once that
// value is found, the id associated with it is returned

export function lookup_id_by (object_list, to_find, property) {
    let id = null;
    object_list.forEach( (obj) => {
        if (obj[property] == to_find) {
            id = obj.id;
        }
    });
    return id;
}