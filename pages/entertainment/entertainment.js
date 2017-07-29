// pages/entertainment/entertainment.js
import {uploadImage} from '../../api/system';
Page({
  data:{
    image: '',
  },
  upload(res) {
    const {formId} = res.detail;
    console.log(formId);
    wx.chooseImage({
      count: 9, // 最多可以选择的图片张数，默认9
      sizeType: ['original', 'compressed'], // original 原图，compressed 压缩图，默认二者都有
      sourceType: ['album'], // album 从相册选图，camera 使用相机，默认二者都有
      success: (res) => {
        this.setData({
          image: res.tempFilePaths,
        })
        wx.uploadFile({
          url: 'https://www.dashengpinche.com/dashengpinche/file/fileUploadByPassenger',
          filePath: this.data.image[0],
          name:'multipartFile',
          header: {
            'Third-Session': wx.getStorageSync('token'),
          }, // 设置请求的 header
          formData: {
            fileInfoType: 'faceSwipingImage',
            formId,
          }, // HTTP 请求中其他额外的 form data
          success: function(res){
            wx.showModal({
              title: '刷脸成功',
              content: '以你最后上传的截图为准,系统将在2个小时内检测截图并赠送拼车券,请注意查看!',
              showCancel: false,
            })
          },
          fail: function(res) {
            wx.showModal({
              title: '上传失败',
              content: res.errMsg,
              showCancel: false,
            })
          },
          complete: function(res) {
            // complete
          }
        })
        // uploadImage(this.data.image);
      },
      fail: function(res) {
        // fail
      },
      complete: function(res) {
        // complete
      }
    })
  },
  onLoad:function(options){
    // 页面初始化 options为页面跳转所带来的参数
    getApp().login();
  },
  onReady:function(){
    // 页面渲染完成
  },
  onShow:function(){
    // 页面显示
  },
  onHide:function(){
    // 页面隐藏
  },
  onUnload:function(){
    // 页面关闭
  }
})