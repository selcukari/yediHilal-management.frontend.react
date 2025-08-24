export const calculateColumnWidthMember = (field: string): number | undefined => {
  const widthMap: {[key: string]: number} = {
    'id': 15,
    'fullName': 35,
    'phoneWithCountryCode': 25,
    'email': 25,
    'isSms': 18,
    'isMail': 18,
    'identificationNumber': 20,
    'dateOfBirth': 20,
    'countryName': 23,
    'provinceName': 25,
    'referenceFullName': 25,
    'referencePhone': 20,
    'createdDate': 25
  };

  return widthMap[field] || undefined;
}

export const calculateColumnWidthUser = (field: string): number | undefined => {
  const widthMap: {[key: string]: number} = {
    'id': 15,
    'fullName': 40,
    'phoneWithCountryCode': 30,
    'email': 45,
    'identificationNumber': 30,
    'dateOfBirth': 20,
    'countryName': 20,
    'provinceName': 25,
    'roleName': 25,
    'createdDate': 25
  };

  return widthMap[field] || undefined;
}
