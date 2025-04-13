# CoquiTones
Full Stack Web Application for Bio-Acoustic Montoring of Amphibian Species
## Features 

### IoT Network Monitor
  To increase the chances of detecting the target species (Eleutherodactylus spp.), multiple nodes will be places in areas of interest within a forest. These areas of interest must be determined by the researcher. Each of these nodes will consist of a microcontroller with microphone and meteorological sensors such as thermometer (temperature), hygrometers (humidity), Barometer (pressure) and rain sensors. From 6pm - 6am, the nodes will have a schedule of recording for 5 minutes every 30 minutes for a total of 120 minutes of audio per node every 24 hours.  After this recording, both the audio and sensor data will be transmitted and relayed to neighboring nodes until it is uploaded to the remote server. 

By having multiple of these nodes, Data is collected simultaneously from various points of interest, thus increasing the probability of detecting the target species. The data collected by the entire network will be uploaded to a remote server to allow remote data access and reduce the amount of time in the field for researchers.   

This Web Application includes an interface for keeping tabs on the network nodes. 

To Build your own IoT network use the code found [HERE](https://github.com/CoquiTones/Hardware)

### Classifier
  To automate the detection of a target species (Eleutherodactylus spp.) from the acoustic data, a machine learning model was created. This machine learning model was trained on 
the previously gathered data that is already made readily available by the researchers at [Proyecto Coqui](https://proyectocoqui.com/). The goal is to provide researchers with a tool that can automate the work that is currently being done manually using sound analysis tools such as raven pro and RainforestCx which require expensive licenses. This model will take in the raw acoustic data as input and output (if present) in what relative timestamp of the audio file the target species is detected. 

### Spectral Analysis Page
In order to offer a manual solution for finding the target species from audio, a Sound Analysis Tool is proposed. This Sound Analysis Tool (SAT) will offer the following features:

- Convert the raw audio files into spectrograms which provide meaningful information needed in order to detect target species. 
- Spectral Analysis Page offers customization: choose between Spectrogram, or Mel Spectrogram as well as customizing the colorscale for the spectrogram.
- SAT will also provide meaningful descriptive data from the audio file such as pitch, sample rate, amplitude,  etc.

### Database Management

Allows Authenticated users full Access to Database containing both Acoustic and Meta-Data. 

# Development 

To get Started, Read our [Development Docs](docs/README.md)
