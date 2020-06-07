export default function(state = {}, action) {
	switch (action.type) {
		case 'USER_LOGIN':
			return {
				...state,
				login: action.payload
			};
		case 'USER_CHANGE_PASSWORD':
			return {
				...state,
				login: action.payload
			};
		case 'USER_AUTH':
			return {
				...state,
				login: action.payload
			};
		case 'USERS_REGISTER':
			return {
				...state,
				register: action.payload.success
			};
		case 'USERS_REGISTER_BLOCKCHAIN':
			return {
				...state,
				register: action.payload.success
			};
		case 'USER_CHARGE_ACCOUNT':
			return {
				...state,
				doc: action.payload
			};
		case 'USER_MAKE_OFFER':
			return {
				...state,
				doc: action.payload
			};
		default:
			return state;
	}
}
