'use strict';

/**
* Позволяет выполнить обработку XHR-запросов и ответов на стороне клиента
*/
var XhrInterceptor = {
  /**
   * Публичные атрибуты и методы
   */

  addRequestCallback: function (callback) {
      // Добавляет обработчик к запросу
      this.requestCallbacks.push(callback);
  },

  removeRequestCallback: function (callback) {
      // Удаляет обработчик запроса
      this.arrayRemove(this.requestCallbacks, callback);
  },

  addResponseCallback: function (callback) {
      // Добавляет обработчик к ответу
      this.responseCallbacks.push(callback);
  },

  removeResponseCallback: function (callback) {
      // Удаляет обработчик ответа
      this.arrayRemove(this.responseCallbacks, callback);
  },

  /**
   * Подключает XhrInterceptor к обработке xhr
   */
  wire: function () {
      if (this.wired) throw new Error("Ajax interceptor already wired");

      // Перегрузка метода отправки всех xhr
      XMLHttpRequest.prototype.send = function () {

          // Запустим обработчики запроса до его отправки
          XhrInterceptor.fireCallbacks(XhrInterceptor.requestCallbacks, this);

          // Подключаем обработчики ответов
          if (this.addEventListener) {
              var xhr = this;
              this.addEventListener("readystatechange", function () {
                  XhrInterceptor.fireResponseCallbacksIfCompleted(xhr);
              }, false);
          }
          else {
              XhrInterceptor.proxifyOnReadyStateChange(this);
          }

          XhrInterceptor.RealXHRSend.apply(this, arguments);
      };
      this.wired = true;
  },

  /**
   * Отключает XhrInterceptor от обработки xhr
   */
  unwire: function () {
      if (!this.wired) throw new Error("Ajax interceptor not currently wired");
      XMLHttpRequest.prototype.send = this.RealXHRSend;
      this.wired = false;
  },

  isWired: function () {
      // Возвращает признак того, подключен ли XhrInterceptor
      return this.wired;
  },

  /**
   * Внутренние атрибуты и методы
   */
  // Неизмененный метод отправки xhr-запроса
  RealXHRSend: XMLHttpRequest.prototype.send,
  // Обработчики запроса
  requestCallbacks: [],
  // Обработчики ответа
  responseCallbacks: [],
  // Признак подключения к обработке
  wired: false,

  /**
   * Удаляет элемент из массива
   */
  arrayRemove: function (array, item) {
      var index = array.indexOf(item);
      if (index > -1) {
          array.splice(index, 1);
      } else {
          throw new Error("Could not remove " + item + " from array");
      }
  },
  /**
   * Вызывает обработчики
   */
  fireCallbacks: function (callbacks, xhr) {
      for (var i = 0; i < callbacks.length; i++) {
          callbacks[i](xhr);
      }
  },
  /**
   * Вызывает обработчики ответа, если запрос завершен
   */
  fireResponseCallbacksIfCompleted: function (xhr) {
      if (xhr.readyState === XMLHttpRequest.DONE) {
          this.fireCallbacks(this.responseCallbacks, xhr);
      }
  },
  /**
   * Дополнительное проксирование успешного завершения запроса для случая,
   * когда добавить listener нельзя
   */
  proxifyOnReadyStateChange: function (xhr) {
      var realOnReadyStateChange = xhr.onreadystatechange;
      if (realOnReadyStateChange) {
          xhr.onreadystatechange = function () {
              this.fireResponseCallbacksIfCompleted(xhr);
              realOnReadyStateChange();
          };
      }
  }
};