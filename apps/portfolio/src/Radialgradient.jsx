import { useEffect, useRef, useState, forwardRef } from "react";
import { Link } from "react-router-dom";
import { CHASER_IMAGES } from "./data/chaserImages";
import { SplitText } from "./utils";

// Star 1 (doc 6) — placed at 55% x, bottom cropped 20%
const Star1 = forwardRef(({ style, className }, ref) => (
  <svg
    ref={ref}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 142.184 137.886"
    aria-hidden="true"
    style={{
      position: "absolute",
      width: 200,
      height: 194,
      pointerEvents: "none",
      fill: "#ffd6f9",
      willChange: "transform",
      ...style,
    }}
  >
    <path d="M59.617,103.319c-.852-1.88-2.326-5.999-3.995-5.855-.498.043-1.212.469-1.734.823,0,0-6.971,4.53-8.992,6.095,0,0-4.051,2.747-5.458,4.226s-11.892,6.737-13.268,7.649c-3.338,2.211-7.195,4.039-11.341,3.405-1.17-.179-1.99-1.49-2.131-2.316-.218-1.276.137-2.586.706-3.676.263-.504.186-1.815.579-2.23,0,0,9.983-9.999,11.757-12.216.972-1.215,8.111-10.247,8.111-10.247,1.311-1.848,2.239-4.151,3.038-6.42.322-.915.65-8.524.65-8.524.042-1.159-.322-1.897-1.386-2.332-4.577-1.868-18.305-11.247-21.122-13.321,0,0-7.346-4.672-8.798-6.553s-.634-1.631-1.463-3.271-.568-2.911.805-3.895c2.416-1.282,5.262-1.037,7.654.336,3.279,1.558,19.644.791,19.644.791l5.591-.015c1.347-.004,2.315-.53,2.907-1.765.429-.895,1.381-1.492,2.025-2.336.563-.738-.29-2.584-.735-3.52-2.582-5.433-6.166-14.69-6.046-16.67s-.823-2.962-.057-4.823c.756-1.837.859-3.968,4.194-3.846,4.451-.935,5.776,3.199,10.789,6.465,1.123.732,2.141,1.858,3.316,2.593l9.09,7.535c.51.554,1.873,1.364,2.595,1.617,0,0,2.682.738,4.226.001,1.044-.285,3.401-7.135,3.401-7.135l3.476-8.333c.768-1.84-.266-9.249,5.499-9.844.764-.079,2.274-.196,2.844.445s3.235,4.983,2.155,7.649c-.65,1.603-1.278,3.008-.999,4.836.649,4.256,1.86,8.271,3.201,12.407.441,1.36,1.613,2.374,2.734,3.229,1.423,1.049,4.315,7.3,4.652,8.3s3.703.274,5.548.55c3.836.572,7.567,1.193,11.243,2.141,5.653,1.458,15.129,3.045,17.064,2.584s5.885,2.05,6.43,2.736,1.687,4.111.732,6.308c-.759,1.621-3.38,2.036-4.964,2.962-3.345,1.957-6.621,3.147-10.181,4.53,0,0-13.258,6.278-14.895,7.094-.405.423-.979,1.029-.99,1.451-.249,4.016,10.805,9.944,13.521,11.858l4.499,3.849c3.531,3.021,6.796,9.491,5.018,13.053-.776,2.228-2.985,3.242-4.724,1.339-1.739-1.903-1.126-1.733-2.371-2.528-.526-.193-15.02-4.084-19.216-6.073-.854-.405-12.274-4.986-14.507-5.563,0,0-6.039-2.516-8.215-2.518-1.157,0-2.452-1.092-3.72-.335-.818.489-.869,1.88-1.014,2.808l-1.789,17.461c-.327,3.203-1.046,7.72-1.143,9.387-.097,1.667-.312,13.143-.324,14.693s-.389,2.879-1.035,3.628-2.335,1.462-3.305.902c-2.557-1.477-3.886-3.968-3.067-6.649.777-2.543.212-4.919-1.036-7.18-1.01-1.831-5.673-17.748-5.673-17.748ZM66.027,103.391s2.75,9.673,3.848,10.599c.593-1.313,1.059-2.844.853-4.148-.598-3.779-.32-7.251-.123-11.157.292-5.799,1.702-11.594,3.537-17.065-.611-1.072-1.091-2.316-.035-3.276.752-.683,1.819-1.135,3.124-.826,0,0,2.17.47,3.11.736s4.455,3.807,4.455,3.807c1.066.91,2.295,1.57,3.39,2.126l6.449,3.278c1.913.972,22.196,9.224,22.196,9.224,2.031.866,3.936,2.672,6.313,2.071.884-.224.248-1.806-.322-2.329-.671-.616-.813-2.24-1.46-2.756-1.104-.878-10.571-7.726-14.195-10.447l-5.592-4.199c-1.688-1.267-3.327-3.109-3.19-5.097l-.072-1.536c-.047-1.849,1.274-3.04,3.047-3.671l3.99-1.419,4.741-2.025,10.782-4.079,4.517-1.812,3.71-1.684c-1.392-1.929-6.442-3.985-8.383-4.356,0,0-32.093-1.256-33.756-2.244-1.662-.987-1.683-1.958-2.585-2.418-1.997-1.019-3.143-2.767-3.633-4.976-.139-.625-.645-1.375-.65-2.541s.186-3.755.9-5.321c.708-1.552,1.561-2.928,2.043-4.712.96-3.555.495-11.734-.001-11.921-.204-.077-.742.215-.855.448l-2.427,4.994s-4.788,8.327-4.423,9.776,1.421,4.922-.656,7.851-7.412,2.958-9.614.866c-2.203-2.092-2.374-5.421-2.816-6.838-.442-1.418-4.92-5.162-7.159-7.274-2.239-2.112-7.006-4.937-8.232-5.806s-2.331.359-2.698,1.312.073,4.296.984,6.301l2.501,5.502c.905,1.991,1.717,4.135,3.427,5.646,2.101,1.857,3.921,5.741,3.36,7.665-.56,1.924-1.446,2.454-2.252,3.24-3.922,2.281-5.449,1.475-9.248.335-4.033-1.21-10.533-1.466-12.346-1.422s-2.622.011-2.622.011c-4.718-.337-13.843-.388-13.311,1.253s1.392,1.754,2.082,2.329c4.753,3.958,9.57,7.47,15.198,10.145,1.56,1.146,7.204,4.22,8.412,4.533,1.997-.849,3.617-.303,5.166.669,1.024.643,1.17,1.143,1.498,2.16,1.033,3.201.198,5.955-1.928,8.451-.837.983-2.747,5.578-3.142,7.14-.396,1.562-2.317,4.71-4.013,6.782-.975,1.191-13.933,14.428-16.124,18.44,3.739-1.091,6.741-2.992,9.828-5.078l9.742-6.584,2.347-1.528c2.789-1.816,5.134-4.751,8.379-5.706,1.801-.53,2.255-2.333,2.492-4.193.202-1.578,2.134-3.274,3.729-3.352,2.411-.119,4.896,2.47,5.093,3.478s1.582,9.934,2.617,12.631ZM109.797,67.199c-.216.831,2.512.033,2.512.033l6.703-2.627c3.088-1.21,6.129-2.054,9.107-3.594.927-.48,2.593-.836,3.038-1.86-.404-1.088-1.663-.292-2.348.075l-3.352,1.796-2.47.668c-2.622.709-4.91,1.554-7.3,2.907-1.044.591-2.631.691-3.649,1.371-.793.529-2.025.401-2.241,1.232ZM106.514,68.712c-.596.109-.096.312.013.246,0,0,.714.039.505-.308s-.028-.028-.518.062ZM23.234,116.072c2.64-1.319,12.671-7.536,14.092-8.684s5.875-4.096,5.875-4.096l5.163-3.542,5.818-3.607c.246-.152.158-1.005-.098-1.138s-.619-.099-1.151.153-3.664,2.732-5.584,3.989l-4.097,2.683-3.754,2.952c-2.323,1.827-4.626,3.364-7.148,4.824l-8.066,4.669c-1.598.925-3.136,1.734-4.436,3.132,1.338-.167.744-.016,3.384-1.335Z"/>
  </svg>
));
Star1.displayName = "Star1";

// Star 2 (doc 5) — placed at 65% x, 90% down
const Star2 = forwardRef(({ style, className }, ref) => (
  <svg
    ref={ref}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 144.908 140.61"
    aria-hidden="true"
    style={{
      position: "absolute",
      width: 200,
      height: 194,
      pointerEvents: "none",
      fill: "#ffd6f9",
      willChange: "transform",
      ...style,
    }}
  >
    <path d="M51.703,71.777s-1.429-.017-1.259-.528,1.873-.051,1.259.528Z"/>
    <path d="M48.079,70.786c-.018.241-1.112.106-1.112.106,0,0-.135.007-.133-.201s.856-.076.856-.076c0,0,.407-.071.389.17Z"/>
    <path d="M48.597,70.934c.128-.128.23-.264.511-.064,0,0,.346.225.356.379s-.027.199-.349.074-.645-.26-.518-.389Z"/>
    <circle cx="52.246" cy="71.71" r=".267"/>
    <g>
      <path d="M69.954,115.884c-.683,2.856-2.274,13.988-2.047,17.128.088,1.224-1.109,2.773-2.087,3.247-1.059.512-2.33.192-3.032-.377-.943-.765-.797-1.97-1.008-3.299.885-2.984-3.631-46.416-3.411-48.112s-1.42-2.523-.956-4.123c.132-1.897-.58-3.605-.743-4.385s-1.091-2.443-1.091-2.443c-.312-.699-.915-1.09-.777-1.4s.696-.208.696-.208c.193-.058-.129-.8-.351-.847l-5.056-1.067-9.133-1.524-1.969-.533c-3.296-1.143-23.837-5.218-27.023-6.498-3.186-1.279-6.203-4.589-4.291-5.931s4.203-1.909,6.541-1.735c5.95.441,15.038-.029,17.742-.703s14.387-4.257,15.652-4.1,1.236-.726,1.931-1.102,1.513-.739.955-1.53c-.139-.43-7.994-9.376-10.783-12.037-2.012-1.92-3.067-5.158-1.234-7.544,1.575-2.051,4.564-2.153,6.908-1.45l5.979,1.795s18.982,4.404,20.12,4.927,3.712-1.441,4.173-2.139,3.323-6.544,4.678-10.025c.738-1.896,1.764-3.772,1.339-5.827-.425-2.055,1.214-7.668,3.19-8.78,1.805-1.015,3.997.432,4.628,2.064.652,1.687.528,2.832.291,4.477l-.704,4.876c-.307,2.126.364,4.281.497,6.393.512,8.188,3.963,10.789,2.827,16.823,1.764-1.8,10.297-3.902,12.417-2.961,2.739,1.192,24.144,3.089,28.85.246,1.924-1.162,5.075-.648,6.409.973,1.992,2.423,1.211,4.783-.702,6.67l-4.273,4.215c-2.44,2.407-5.45,4.107-8.464,5.851l-10.047,5.814c-.907.525-2.374,1.6-2.726,2.524,0,0-.94,4.642.021,5.782.961,1.14,7.982,14.897,8.223,16.337l1.371,3.234,3.694,12.09c.805,2.634,1.725,5.287,2.218,7.985.287,1.57.445,2.791,1.105,4.265.598,1.336,1.014,2.994,1.259,4.438.357,2.102-.897,4.069-2.821,4.556-1.154.292-2.063.05-2.354-1.429s-5.612-7.415-5.612-7.415l-4.738-4.565-5.406-4.678-3.362-3.371-3.841-3.814c-1.881-1.868-7.704-7.419-8.745-8.55-4.005-4.503-12.441-12.139-13.104-11.975s.419.743.083,1.566-.971.06-1.13.349c-.208.378-.419,1.087-.514,1.511l-.751,3.348c-.879,3.92-2.824,7.457-3.953,11.245l-1.786,5.988-3.769,15.758ZM65.474,118.979c.834-.377,2.742-11.376,2.742-11.376l2.146-7.909,1.867-7.492,1.962-7.838,1.773-6.48c.207-1.925,1.387-5.113,2.495-4.742s.921.203.854.005l-.355-1.042c-.26-.763-.768-1.691-.401-2.271.5-.787,1.338-.944,2.315-.75,1.822.363,3.463,2.005,3.947,3.876.745,2.881,2.589,4.83,4.717,6.87l2.553,2.446,2.421,2.363,7.42,7.212,9.364,9.369,3.473,3.689,4.634,4.741,5.511,5.329c.459-1.172.097-2.229-.196-3.37l-1.383-5.39c-.831-6.16-2.506-11.906-4.959-17.605l-1.843-4.281c-1.391-3.232-3.08-6.067-5.007-8.99l-3.723-5.646c-.899-1.363-1.988-3.038-1.47-4.583.488-1.455,1.293-3.188,2.783-3.736,4.902-1.802,9.185-4.33,13.802-6.74,4.373-2.282,8.544-4.404,11.356-8.878-.808-.619-2.001-1.644-3.226-1.61-7.364.203-13.061-1.052-19.336-.786-1.945.083-4.15-.291-5.945.493-4.06,1.774-11.345.673-16.191-.1-1.203-.192-2.462.725-3.736-.195-1.427-1.029-3.53-5.473-3.143-7.011.362-1.438.877-3.474,1.65-4.691,1.491-1.862,2.288-3.432,1.982-5.924l-.71-5.778c-1.838,3.033-4.653,9.495-4.505,12.047l.18,3.111c-.266,2.427-.237,2.406-1.232,3.276-2.107,1.841-4.757,2.421-7.176.688-2.293-1.642-4.728-2.282-7.576-2.772l-4.41-.76s-11.389-2.432-12.616-2.857-1.105.693-1.3,1.109c-.38.812.725,2.395,1.754,3.553l3.38,3.806c1.049,1.182,1.573,3.287,3.235,3.762,0,0,3.314.56,4.502,1.286s2.348,3.991,2.056,5.748c-.35,2.107-1.354,2.884-2.932,3.523-.739.299-1.336.904-2.297.775-1.54-.208-23.898,1.246-25.547,1.412s-5.358.64-8.07.892l-4.258.396c-.814.076-2.847.685-1.737,1.166s8.207,2.619,8.207,2.619c.878.28,15.625,2.965,15.625,2.965l15.038,2.74c1.514-1.865,3.632-1.71,5.493-.527.867-.287,2.77,4.46,2.385,6.137-.241,1.051.181,1.457-.389,2.198s.298,15.308.298,15.308l.567,17.47c.023,2.76.572,5.296.413,8.106-.025.435-.065,2.023.769,1.645Z"/>
      <path d="M121.208,53.464c-.425-.433,1.55-1.383,1.74-.889s-1.315,1.322-1.74.889Z"/>
      <path d="M123.328,52.578c-.299-.67,1.327-1.003,2.019-.818s-1.72,1.488-2.019.818Z"/>
      <path d="M113.345,57.936c.379-.009.719.309.424.406s-.451.398-.742.179-.062-.576.318-.585Z"/>
      <path d="M117.17,55.922c-.143-.186.848-.962,1.249-.966s.192.226.192.226l-.968.705s-.33.221-.473.035Z"/>
      <path d="M114.394,57.392c.166-.049.358-.25.6-.112s-.372.411-.372.411c-.073.081-.336-.267-.228-.299Z"/>
      <path d="M126.074,51.237c.194.129-.105.235-.235.235s-.24-.057-.235-.235.079-.224.235-.235.041.105.235.235Z"/>
      <path d="M131.114,47.879c0,.13-.085.342-.235.235s-.149-.169-.235-.235.044-.358.235-.235.235.105.235.235Z"/>
    </g>
  </svg>
));
Star2.displayName = "Star2";

// Star 3 (doc 7) — placed at 0% x (25% cropped left), 35% down
const Star3 = forwardRef(({ style, className }, ref) => (
  <svg
    ref={ref}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 142.184 159.136"
    aria-hidden="true"
    style={{
      position: "absolute",
      width: 200,
      height: 224,
      pointerEvents: "none",
      fill: "#ffd6f9",
      willChange: "transform",
      ...style,
    }}
  >
    <path d="M83.463,136.012c.147,2.936.928,10.065,1.695,9.369,0,0,.799-.155.879-.799s3.659-11.988,3.659-11.988c.872-2.29,4.682-16.525,4.682-16.525.439-1.77,2.626-13.749,2.865-18.158l.185-3.404.819-6.207c.233-1.762,1.397-3.687,2.946-4.803.66-.382,1.989-.22,2.921-.333,0,0-1.68-.421-1.648-1.188s5.578.638,5.819.685.74-.312.74-.312c.173-.073.523.521.364.62-.199.124-.631.268-.966.303l-3.217.337c.897.586,1.98.633,3.165.646l5.745.063c4.28.047,4.252-3.652,9.244-4.389-.95-2.197-5.596-1.917-7.156-2.584-9.889-4.225-15.352,3.913-18.849-3.672-.884-1.917-.556-3.959.736-5.524,1.117-1.354,3.084-1.306,4.468-2.214l13.298-9.282c2.018-1.491,3.586-3.233,5.897-4.702-4.467.37-19.216,5.711-21.574,4.396-2.358-1.315-2.545-3.281-3.078-5.565-.529-2.267-2.33-4.416-1.871-6.917l3.116-10.688,1.819-8.564-1.511,1.888c-1.3,1.624-12.76,14.431-12.941,16.124-.207,4.27-6.802,5.306-9.425,4.498s-3.334-4.438-4.488-5.264c-2.854-2.044-8.564-4.841-11.883-6.114-5.094-1.954-10.364-2.984-15.547-4.659-1.157-.374-3.332-.502-3.047.939s12.111,14.425,13.536,17.17c2.154.485,4.211,1.222,5.642,3.013.359.738.883,2.278.886,3.09.014,3.453-2.715,5.811-6.006,6.133-2.703.264-5.184.489-7.696,1.699-3.314,1.596-6.682,2.746-10.06,4.084-2.686,1.065-13.923,5.092-17.037,5.698l-7.122,2.693c-2.499,1.425-4.615,4.347-3.166,4.815,2.059.665,6.846-.492,6.732.286s-10.823,2.119-12.328-.746c-.543-1.034-.387-2.22-.142-3.222.992-4.054,5.931-4.899,9.376-5.898,0,0,8.587-3.325,10.613-4.133,1.456-.581,2.95-1.015,4.39-1.751l6.168-3.15,3.39-1.401c4.832-1.997,11.152-5.404,13.618-10.034-.681-.961-1.921-1.774-2.439-2.72-2.1-3.831-5.234-6.315-8.087-9.31,0,0-6.979-6.848-8.174-7.808-1.464-1.175-2.953-4.837-1.768-6.709,2.158-3.409,6.327-3.073,9.767-.407,1.101.967,11.658,3.77,11.658,3.77,3.369,1.041,13.036,5.17,14.726,5.72,0,0,5.989,2.733,8.085,2.709,1.71-.529,3.433-1.608,5.329-.591,2.213-1.521,3.979-3.025,5.749-4.868,1.273-.642,10.319-11.223,10.629-14.306.206-2.045.139-7.247,3.126-9.374,1.282-.802,3.614-2.116,5.323-1.501,2.286.822,2.905,3.074,3.42,5.278.076,1.855.552,2.497-1.06,5.6s-3.885,5.917-4.021,9.419c-.159,4.079-.518,19.417-.632,20.365s.344,1.49.729,1.759c.591.413,1.399.402,2.076.482,6.981.823,17.054-2.152,22.483-6.85,2.217-1.919,6.529-1.622,7.614.242,1.085,1.864,1.697,1.293,1.527,4.189s-6.136,3.613-12.178,7.014c0,0-17.103,12.077-19.984,14.644.961.87,1.601,1.446,1.79,2.53.86.757,1.992,1.314,3.194,1.413,3.641.301,7.129.933,10.726,1.02,1.686.041,3.282-1.129,4.72-1.657,1.756-.645,7.138,1.23,6.885,5.479-.287,4.822-7.88,4.672-9.411,5.993s-4.965,3.911-8.551,4.258c0,0-6.8.873-7.638.739s-1.92-.618-2.41-.02c0,0-1.574,2.736-1.789,4.171s-5.004,24.325-5.004,24.325c0,0-.975,3.664-1.495,5.535l-3.636,13.105s-2.838,9.591-2.98,10.627c-.143,1.036-.838,5.866-.838,5.866-.216,1.509-.744,2.64-1.877,3.647-1.054.936-3.073,1.569-4.081.548s-1.171-3.953-.885-5.178-1.907-12.882-2.132-19.572l-.426-12.661-1.521-18.914c-.082-2.802-.683-12.262-2.059-12.279s-1.65.644-2.284,1.477l-5.278,6.926c-.973,1.277-9.875,17.357-10.632,19.723-1.386,4.329-3.229,8.47-3.386,13.115-.081,2.416-1.566,4.899-4.234,4.727-1.23-.08-2.018-1.33-2.241-2.161-.822-3.057,2.603-4.711,2.166-8.914-.236-2.272.576-4.547.712-6.835.137-2.292.253-4.467,1.101-6.624.866-2.202,1.671-13.126,1.694-16.396.022-3.216.099-8.436-.09-9.503s-1.994-2.599-.818-3.711c.834-.251-2.855.187-4.226.459-2.253.448-4.439.955-6.631,1.816-6.063,2.382-9.034,1.604-14.739,2.261l-9.584,1.104c-3.191.368-8.896.895-9.598.192s4.695-.336,6.958-.768c0,0,9.442-2.114,10.698-2.046s15.966-2.652,16.052-3.114,8.763-1.268,8.763-1.268c1.157-.008,2.418-1.809,2.234-1.932s-1.544.239-1.868-.249,3.495-2.604,5.186-2.616c2.806-.021,5.303,2.645,4.911,5.434-.084.598-.3,1.513-.446,1.969l-.817,2.559c-.762,2.387-.413,4.304-.782,5.829-1.105,4.572-1.714,8.982-2.065,13.631-.21,2.779-1.477,5.367-.512,8.355l1.114-2.124c1.297-2.473,3.026-6.299,3.607-7.414.581-1.115,10.881-17.264,13.289-18.374.868-1.396-.03-4.208,2.19-4.749,1.631-.397,3.202.872,4.041,1.82,1.35,1.524.809,2.932.901,4.746l.539,10.644.469,5.565c.207,2.453.111,15.109.143,19.039l.331,17.322Z"/>
    <path d="M31.378,79.477c-2.92.096-5.657.793-8.652.574,1.655-1.13,3.416-1.174,5.238-1.356,4.395-.44,8.786-.581,13.014-1.881.935-.288,2.329-.989,2.74-.646s-2.179,1.102-3.311,1.52c-2.947,1.088-5.873,1.685-9.028,1.789Z"/>
    <path d="M109.748,83.019c-.235-.481.729-.392.923-.296.182.091.108-.274.462-.536s7.287-1.537,6.92-.61-8.07,1.924-8.305,1.442Z"/>
    <path d="M50.189,75.058c-.613.396-4.311,1.293-5.271.504s5.106-.976,5.291-.917.593.017-.02.413Z"/>
    <path d="M22.705,80.191s-5.189.768-5.431.641-.188-.311-.188-.311c0,0,5.201-.985,5.479-.931s.636.347.139.601Z"/>
    <path d="M50.535,74.466c.097-.203.568-.127.568-.127.099-.022.234.34.14.378l-.373.153c-.141.058-.432-.2-.335-.403Z"/>
  </svg>
));
Star3.displayName = "Star3";

function homeNavLinkStyle() {
  return {
    fontSize: "2rem",
    fontWeight: 500,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    textDecoration: "none",
    borderBottom: "3px solid #C93500",
    color: "#C93500",
    pointerEvents: "all",
  };
}

export default function RepulseLogo() {
  const imgRef = useRef(null);
  const chaserRef = useRef(null);
  const star1Ref = useRef(null);
  const star2Ref = useRef(null);
  const star3Ref = useRef(null);

  const [chaserImage, setChaserImage] = useState(null);
  const [chaserVisible, setChaserVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const chaserPos = useRef({ x: 0, y: 0 });
  const cursorPos = useRef({ x: 0, y: 0 });
  const animFrame = useRef(null);

  // threshold = how close mouse needs to get
  // force = how far it pushes
  // maxRotation = max degrees of rotation at full push (deg)
  // push transition = how fast it moves away
  // return transition = how slowly it drifts back
  // Split into a pure calculation (reads a pre-fetched rect, writes
  // nothing) and a style application (writes only) — interleaving
  // getBoundingClientRect() reads with style writes across multiple
  // elements, as the previous single combined function did when called
  // 4x in a row, forces a synchronous layout recalculation between each
  // pair (classic layout thrashing). handleMouseMove below reads all 4
  // rects first, then writes all 4 styles, so the browser does one
  // layout pass instead of up to four.
  const computeRepulsion = (rect, mouseX, mouseY, threshold, force, maxRotation) => {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = centerX - mouseX;
    const dy = centerY - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < threshold) {
      const strength = (threshold - dist) / threshold;
      const angle = Math.atan2(dy, dx);
      const pushX = Math.cos(angle) * strength * force;
      const pushY = Math.sin(angle) * strength * force;
      // Rotate based on horizontal push direction — left push tilts negative, right tilts positive
      const rotateDeg = -pushX / force * maxRotation;
      return {
        transition: "transform 3.5s cubic-bezier(0.22, 0.61, 0.36, 1)",
        transform: `translate(${pushX}px, ${pushY}px) rotate(${rotateDeg}deg)`,
      };
    }
    return {
      transition: "transform 3.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      transform: "translate(0px, 0px) rotate(0deg)",
    };
  };

  const applyStyle = (el, style) => {
    el.style.transition = style.transition;
    el.style.transform = style.transform;
  };

  // Liquid Glass on iOS 26 ignores theme-color and falls back to html/body's
  // real background-color when sampling for toolbar tint — #fce7f5 is the
  // same sampled edge color used for the theme-color meta tag in App.jsx
  // (the actual page background is cream, but the giant blurred circle
  // covers the whole viewport, so that's what should be sampled here).
  useEffect(() => {
    document.documentElement.style.backgroundColor = "#fce7f5";
    document.body.style.backgroundColor = "#fce7f5";
    return () => {
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
    };
  }, []);

  // Repulsion effect — logo + all three stars. Desktop only: there's no
  // real cursor to repel from on touch, so skip attaching the listener
  // (and doing the per-mousemove rect/transform work) entirely instead
  // of just relying on it coincidentally never firing.
  useEffect(() => {
    if (isMobile) return;
    const handleMouseMove = (e) => {
      cursorPos.current = { x: e.clientX, y: e.clientY };

      const logoEl = imgRef.current;
      const star1El = star1Ref.current;
      const star2El = star2Ref.current;
      const star3El = star3Ref.current;

      // Read phase — all 4 rects, before any writes below.
      const logoStyle = logoEl && computeRepulsion(logoEl.getBoundingClientRect(), e.clientX, e.clientY, 400, 400, 0);
      const star1Style = star1El && computeRepulsion(star1El.getBoundingClientRect(), e.clientX, e.clientY, 150, 45, 5);
      const star2Style = star2El && computeRepulsion(star2El.getBoundingClientRect(), e.clientX, e.clientY, 150, 45, 5);
      const star3Style = star3El && computeRepulsion(star3El.getBoundingClientRect(), e.clientX, e.clientY, 150, 45, 5);

      // Write phase.
      if (logoStyle) applyStyle(logoEl, logoStyle);
      if (star1Style) applyStyle(star1El, star1Style);
      if (star2Style) applyStyle(star2El, star2Style);
      if (star3Style) applyStyle(star3El, star3Style);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isMobile]);

  // Chaser animation loop — desktop only, same reasoning as the
  // repulsion effect above (nothing drives cursorPos on touch, so this
  // would otherwise just spin forever lerping toward a stale position).
  useEffect(() => {
    if (isMobile) return;
    const animate = () => {
      chaserPos.current.x += (cursorPos.current.x - chaserPos.current.x) * 0.08;
      chaserPos.current.y += (cursorPos.current.y - chaserPos.current.y) * 0.08;
      if (chaserRef.current) {
        chaserRef.current.style.transform = `translate(${chaserPos.current.x}px, ${chaserPos.current.y}px)`;
      }
      animFrame.current = requestAnimationFrame(animate);
    };
    animFrame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame.current);
  }, [isMobile]);

  const handleLinkEnter = () => {
    if (isMobile) return;
    const randomImg = CHASER_IMAGES[Math.floor(Math.random() * CHASER_IMAGES.length)];
    setChaserImage(randomImg);
    setChaserVisible(true);
  };

  const handleLinkLeave = () => {
    if (isMobile) return;
    setChaserVisible(false);
  };

  return (
    <>
    <h1 className="sr-only">Melanie Patterson — Artist &amp; Designer</h1>
    {/* Stars in their own unclipped layer so overflow doesn't swallow their movement.
        zIndex:1 keeps them below .home-nav's zIndex:10 (WORK/INFO links stay on top). */}
    <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }}>
      <Star1
        ref={star1Ref}
        className={isMobile ? "starDrift" : undefined}
        style={isMobile ? { left: "calc(40%)", bottom: "-49px", animationDelay: "0s" } : { left: "55%", bottom: "-40px" }}
      />
      <Star2
        ref={star2Ref}
        className={isMobile ? "starDrift" : undefined}
        style={isMobile ? { right: "-55px", top: "calc(55%)", animationDelay: "-6s" } : { left: "65%", top: "90%" }}
      />
      <Star3
        ref={star3Ref}
        className={isMobile ? "starDrift" : undefined}
        style={isMobile ? { left: "-50px", top: "20%", animationDelay: "-12s" } : { left: "-50px", top: "20%" }}
      />
    </div>

    <div style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 0,
      overflow: "hidden"
    }}>

      {/* Chaser image */}
      <div
        ref={chaserRef}
        style={{
          position: "fixed",
          top: -120,
          left: 0,
          width: 160,
          height: 120,
          pointerEvents: "none",
          zIndex: 4,
          opacity: chaserVisible ? 1 : 0,
          transition: "opacity 0.2s ease"
        }}
      >
        {chaserImage && (
          <img
            src={chaserImage}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "grayscale(100%)" }}
          />
        )}
        <div
          style={{
            backgroundColor: "#c93500",
            mixBlendMode: "screen",
            position: "absolute",
            inset: 0
          }}
        />
      </div>

      <img
        ref={imgRef}
        src="/images/melanie studio circle.svg"
        alt=""
        style={{
          width: isMobile ? 980 : 1500,
          height: isMobile ? 980 : 1500,
          willChange: "transform",
        }}
      />

      <div className="home-nav" style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
        pointerEvents: "none"
      }}>
        <Link
          to="/portfolio"
          onMouseEnter={handleLinkEnter}
          onMouseLeave={handleLinkLeave}
          style={homeNavLinkStyle()}
        ><SplitText>Work</SplitText></Link>
        <Link
          to="/about-contact"
          onMouseEnter={handleLinkEnter}
          onMouseLeave={handleLinkLeave}
          style={homeNavLinkStyle()}
        ><SplitText>Info</SplitText></Link>
      </div>
    </div>
    </>
  );
}