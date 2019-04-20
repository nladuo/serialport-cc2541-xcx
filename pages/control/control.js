// pages/control/control.js
import { char2buf, buf2char} from "./utils.js"

let app = getApp();

Page({
  data: {
    deviceId: '',           // BLE设备id
    name: '',               // BLE设备名称
    serviceId: '',          // 服务ID，以FFE0开头
    characteristicId: '',   // 特征ID，以FFE1开头 
    result: '',             // 显示text到界面
    textToSend: ''
  },

  onLoad (options) {
    let that = this;
    console.log("onLoad");
    console.log('deviceId=' + options.deviceId);
    console.log('name=' + options.name);
    that.setData({deviceId: options.deviceId});
    /**
     * 设置NavigationBar的Title
     */
    wx.setNavigationBarTitle({
      title: options.name,
    });
    /**
     * 监听设备的连接状态
     */
    wx.onBLEConnectionStateChange((res) => {
      console.log(`Connected status: ${res.connected}`)
    })
    /**
     * 连接到BLE设备
     */
    wx.createBLEConnection({
      deviceId: that.data.deviceId,
      success: function(res) {
        wx.getBLEDeviceServices({
          deviceId: that.data.deviceId,
          success: function(res) {
            console.log(res.services);
            // 找服务ID
            res.services.forEach((service) => {
              console.log("serviceId->", service.uuid)
              if (service.uuid.indexOf("FFE0") != -1) {
                that.setData({ serviceId: service.uuid });
              }
            })
            // 没找到，返回
            if (that.data.serviceId == '') {
              wx.showModal({
                title: '错误',
                content: '没找到指定服务ID, 请检查蓝牙型号是否正确',
                showCancel: false,
                success(res) {
                  wx.redirectTo({
                    url: '../scan/scan'
                  })
                }
              })
            }
            // 等待加载框
            wx.showLoading({
              title: '连接中...',
            })
            /**
             * 设置3秒延时，根据服务ID获取特征ID
             */
            setTimeout(() => {
              wx.hideLoading(); //隐藏加载框
              wx.getBLEDeviceCharacteristics({
                deviceId: that.data.deviceId,
                serviceId: that.data.serviceId,
                success: function (res) {
                  /**
                   * 找characteristicId
                   */
                  res.characteristics.forEach((characteristic) => {
                    console.log("characteristic->", characteristic.uuid);
                    if (characteristic.uuid.indexOf("FFE1") != -1) {
                      that.setData({
                        characteristicId: characteristic.uuid,
                      });
                    }
                    // 没找到，返回
                    if (that.data.characteristicId == '') {
                      wx.showModal({
                        title: '错误',
                        content: '没找到指定服务ID, 请检查蓝牙型号是否正确',
                        showCancel: false,
                        success(res) {
                          wx.redirectTo({
                            url: '../scan/scan'
                          })
                        }
                      })
                    }
                    /**
                     * 设置接受数据通知
                     */
                    wx.notifyBLECharacteristicValueChange({
                      deviceId: that.data.deviceId,
                      serviceId: that.data.serviceId,
                      characteristicId: that.data.characteristicId,
                      state: true,
                      success (res) {
                        /**
                         * 监听接受的数据，渲染到界面
                         */
                        wx.onBLECharacteristicValueChange(function (characteristic) {
                          // console.log(characteristic.value)
                          console.log("received--->", buf2char(characteristic.value));
                          let res = that.data.result += buf2char(characteristic.value);
                          that.setData({
                            result: res
                          })
                        })
                      },
                    })

                  })
                },
              })
            }, 3000)
          }
        })
      }
    })
  },

  sendTxtToBle () {
    console.log(this.data.textToSend);
    wx.writeBLECharacteristicValue({
      deviceId: this.data.deviceId,
      serviceId: this.data.serviceId,
      characteristicId: this.data.characteristicId,
      value: char2buf(this.data.textToSend),
      success: function (res) { 
        console.log(res);
      },
    })
  },

  bindKeyInput(e) {
    this.setData({
      textToSend: e.detail.value
    })
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload () {
    wx.closeBLEConnection({
      deviceId: this.data.deviceId
    })
  }
})