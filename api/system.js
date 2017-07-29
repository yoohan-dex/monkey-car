import fetch, { upload } from '../utils/fetch';

function getContact() {
  return fetch('GET')('customerContact');
}

function uploadImage(uri) {
  const formData = new FormData(); // eslint-disable-line no-undef
  const file = { uri, type: 'multipart/form-data', name: 'face.png' };
  formData.append('multipartFile', file);
  formData.append('fileInfoType', 'faceSwipingImage');
  return upload('file/fileUploadByPassenger', formData);
}

export {
  uploadImage,
  getContact,
}