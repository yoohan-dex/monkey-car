// pages/bindPhone/bindPhone.js
import {
  getValidCode,
  bindPhone,
} from '../../api/auth'
Page({
  data:{
    phone: '',
    validCode: '',
    seconds: 0,
    isRegistered: false,
  },
  onLoad:function(options){
    // 页面初始化 options为页面跳转所带来的参数
  },
  onReady:function(){
    // 页面渲染完成
  },
  freshRegister() {
    const {isRegistered} = getApp().globalData;
    this.setData({
      isRegistered,
    })
  },
  onShow:function(){
    // 页面显示
    this.freshRegister();
  },
  onHide:function(){
    // 页面隐藏
  },
  change(key) {
    return e => this.setData({
      [`${key}`]: e.detail.value,
    })
  },
  onPhoneChange(e) {
    this.change('phone')(e);
  },
  onValidChange(e) {
    this.change('validCode')(e);
  },
  onValid() {
    const { seconds, phone } = this.data;
    if (seconds === 0) {
      if (phone.length === 11) {
        getValidCode(this.data.phone);
        this.setData({
          seconds: 30,
        })
        this.checkSecond();  
      } else {
        wx.showModal({
          title: '获取验证码失败',
          content: '请检查手机是否输入正确',
          showCancel: false,
        });
      }
    }
  },
  onConfirmPhone() {
    const { phone, validCode } = this.data;
    if (phone.length === 11 && validCode.length === 4) {
      bindPhone({phone, validCode}).then(
        () => {
          wx.showToast({
            title: '绑定成功',
            icon: 'success',
            duration: 1000,
          })
          console.log(getApp());
          getApp().setGlobalData({
            isRegistered: true,
          })
        }
      ).catch(
        (e) => {
          wx.showModal({
            title: '绑定手机失败',
            content: e,
            showCancel: false,
          })
        }
      )
    } else {
        wx.showModal({
          title: '绑定手机失败',
          content: '请检查手机或验证码是否输入正确',
          showCancel: false,
        });
    }
  },
  checkSecond() {
    const cur = Object.assign({}, this.data);
    this.setData({ seconds: cur.seconds -1})
    if (this.data.seconds > 0) {
      setTimeout(() => this.checkSecond(), 1000);  
    }
  },
  onUnload:function(){
    // 页面关闭
  }
})