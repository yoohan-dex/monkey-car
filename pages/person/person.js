// pages/person/person.js
Page({
  data:{
    items: [ 'coupons', 'bindPhone', 'agreement', 'about', 'relogin'],
    ch: [ '拼车券', '绑定手机', '使用条例', '关于我们', '重新登录'],
    throttle: false,
  },
  to(e) {
    const {type} =  e.currentTarget.dataset;
    if (type !== 'relogin') {
      wx.navigateTo({
        url: `../${type}/${type}`,
      })
    }
  },
  relogin() {
    if (!this.data.throttle) {
      getApp().login(() => {
        wx.showToast({
        title: '登录成功',
        type: 'success',
      });
      this.setData({throttle: true});
      setTimeout(() => this.setData({ throttle: false }), 10000);
      });
    }
  },
  onLoad:function(options){
    // 页面初始化 options为页面跳转所带来的参数
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