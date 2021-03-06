import '@polymer/iron-icon/iron-icon.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { PolymerElement } from '@polymer/polymer/polymer-element.js';

import '../components/ha-card.js';

import EventsMixin from '../mixins/events-mixin.js';
import LocalizeMixin from '../mixins/localize-mixin.js';

/*
 * @appliesMixin LocalizeMixin
 */
class HaWeatherCard extends
  LocalizeMixin(EventsMixin(PolymerElement)) {
  static get template() {
    return html`
    <style>
      :host {
        cursor: pointer;
      }

      .content {
        padding: 0 20px 20px;
      }

      iron-icon {
        color: var(--paper-item-icon-color);
      }

      .now {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
      }

      .main {
        display: flex;
        align-items: center;
        margin-right: 32px;
      }

      .main iron-icon {
        --iron-icon-height: 72px;
        --iron-icon-width: 72px;
        margin-right: 8px;
      }

      .main .temp {
        font-size: 52px;
        line-height: 1em;
        position: relative;
      }

      .main .temp span {
        font-size: 24px;
        line-height: 1em;
        position: absolute;
        top: 4px;
      }

      .now-text {
        font-size: 24px;
      }

      .forecast {
        margin-top: 24px;
        display: flex;
        justify-content: space-between;
      }

      .forecast div {
        flex: 0 0 auto;
        text-align: center;
      }

      .forecast .icon {
        margin: 8px 0;
        text-align: center;
      }

      .weekday {
        font-weight: bold;
      }

      .attributes,
      .templow {
        color: var(--secondary-text-color);
      }
    </style>
    <ha-card header="[[stateObj.attributes.friendly_name]]">
      <div class="content">
        <div class="now">
          <div class="main">
            <template is="dom-if" if="[[showWeatherIcon(stateObj.state)]]">
              <iron-icon icon="[[getWeatherIcon(stateObj.state)]]"></iron-icon>
            </template>
            <div class="temp">
              [[stateObj.attributes.temperature]]<span>[[getUnit('temperature')]]</span>
            </div>
          </div>
          <div class="attributes">
            <template is="dom-if" if="[[stateObj.attributes.pressure]]">
              <div>
                [[localize('ui.card.weather.attributes.air_pressure')]]:
                [[stateObj.attributes.pressure]] hPa
              </div>
            </template>
            <template is="dom-if" if="[[stateObj.attributes.humidity]]">
              <div>
                [[localize('ui.card.weather.attributes.humidity')]]:
                [[stateObj.attributes.humidity]] %
              </div>
            </template>
            <template is="dom-if" if="[[stateObj.attributes.humidity]]">
              <div>
                [[localize('ui.card.weather.attributes.wind_speed')]]:
                [[getWind(stateObj.attributes.wind_speed, stateObj.attributes.wind_bearing, localize)]]
              </div>
            </template>
          </div>
        </div>
        <div class="now-text">
          [[computeState(stateObj.state, localize)]]
        </div>
        <template is="dom-if" if="[[forecast]]">
          <div class="forecast">
            <template is="dom-repeat" items="[[forecast]]">
              <div>
                <div class="weekday">[[computeDateTime(item.datetime)]]</div>
                <template is="dom-if" if="[[item.condition]]">
                  <div class="icon">
                    <iron-icon icon="[[getWeatherIcon(item.condition)]]"></iron-icon>
                  </div>
                </template>
                <div class="temp">[[item.temperature]] [[getUnit('temperature')]]</div>
                <template is="dom-if" if="[[item.templow]]">
                  <div class="templow">[[item.templow]] [[getUnit('temperature')]]</div>
                </template>
              </div>
            </template>
          </div>
        </template>
      </div>
    </ha-card>
`;
  }

  static get properties() {
    return {
      hass: Object,
      stateObj: Object,
      forecast: {
        type: Array,
        computed: 'computeForecast(stateObj.attributes.forecast)'
      }
    };
  }

  constructor() {
    super();
    this.cardinalDirections = [
      'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N'
    ];
    this.weatherIcons = {
      'clear-night': 'mdi:weather-night',
      cloudy: 'mdi:weather-cloudy',
      fog: 'mdi:weather-fog',
      hail: 'mdi:weather-hail',
      lightning: 'mid:weather-lightning',
      'lightning-rainy': 'mdi:weather-lightning-rainy',
      partlycloudy: 'mdi:weather-partlycloudy',
      pouring: 'mdi:weather-pouring',
      rainy: 'mdi:weather-rainy',
      snowy: 'mdi:weather-snowy',
      'snowy-rainy': 'mdi:weather-snowy-rainy',
      sunny: 'mdi:weather-sunny',
      windy: 'mdi:weather-windy',
      'windy-variant': 'mdi:weather-windy-variant'
    };
  }

  ready() {
    this.addEventListener('click', this._onClick);
    super.ready();
  }

  _onClick() {
    this.fire('hass-more-info', { entityId: this.stateObj.entity_id });
  }

  computeForecast(forecast) {
    return forecast && forecast.slice(0, 5);
  }

  getUnit(unit) {
    return this.hass.config.core.unit_system[unit] || '';
  }

  computeState(state, localize) {
    return localize(`state.weather.${state.replace('-', '_')}`) || state;
  }

  showWeatherIcon(condition) {
    return condition in this.weatherIcons;
  }

  getWeatherIcon(condition) {
    return this.weatherIcons[condition];
  }

  windBearingToText(degree) {
    const degreenum = parseInt(degree);
    if (isFinite(degreenum)) {
      return this.cardinalDirections[(((degreenum + 11.25) / 22.5) | 0) % 16];
    }
    return degree;
  }

  getWind(speed, bearing, localize) {
    if (bearing != null) {
      const cardinalDirection = this.windBearingToText(bearing);
      return `${speed} ${this.getUnit('length')}/h (${localize(`ui.card.weather.cardinal_direction.${cardinalDirection.toLowerCase()}`) || cardinalDirection})`;
    }
    return `${speed} ${this.getUnit('length')}/h`;
  }

  computeDateTime(data) {
    const date = new Date(data);
    const provider = this.stateObj.attributes.attribution;
    if (provider === 'Powered by Dark Sky' || provider === 'Data provided by OpenWeatherMap') {
      return date.toLocaleTimeString(
        this.hass.selectedLanguage || this.hass.language,
        { hour: 'numeric' }
      );
    }
    return date.toLocaleDateString(this.hass.selectedLanguage || this.hass.language, { weekday: 'short' });
  }
}
customElements.define('ha-weather-card', HaWeatherCard);
