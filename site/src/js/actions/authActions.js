import * as types from '../actionTypes';

export function loginRequest() {
    return {
        type: types.LOGIN_REQUEST
    }
}

export function login(credentials) {
    return Promise.resolve(() => {
        let {user, pass} = credentials;

        if (user === 'john' && pass === 'password') {
            return {
                type: types.LOGIN_SUCCESS,
                payload: {
                    user,
                    loggedIn: true,
                    id: 1
                }
            };
        } else {
            return {
                type: types.LOGIN_FAILURE
            }
        }
    });
}

export function logout() {
    return {
        type: types.LOGOUT
    }
}