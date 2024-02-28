#include <MicWrapper.h>


Microphone::Microphone () {
    this->setup();
}

void Microphone::setup() {

    ESP_LOGI(TAG, "Starting up");

    SDCard* sd = new SDCard("/sdcard", PIN_NUM_MISO, PIN_NUM_MOSI, PIN_NUM_CLK, PIN_NUM_CS);

    ESP_LOGI(TAG, "Creating microphone");
    #ifdef USE_I2S_MIC_INPUT
        this->input = new I2SMEMSSampler(I2S_NUM_0, i2s_mic_pins, i2s_mic_Config);
    #else
        this->input = new ADCSampler(ADC_UNIT_1, ADC1_CHANNEL_7, i2s_adc_config);
    #endif

   
}
void Microphone::record()
{
	int16_t *samples = (int16_t *)malloc(sizeof(int16_t) * 1024);
	ESP_LOGI(TAG, "Start recording");
	input->start();
	// open the file on the sdcard
    const char* fname = "TODAYS DATE AND TIMESTAMP";
	FILE *fp = fopen(fname, "wb");
	// create a new wave file writer
	WAVFileWriter *writer = new WAVFileWriter(fp, input->sample_rate());
    
	// TODO: MODIFY THIS TO BE 5 MINUTE TIMER
	while (gpio_get_level(GPIO_NUM_0) == 1)
	{
		int samples_read = input->read(samples, 1024);
		int64_t start = esp_timer_get_time();
		writer->write(samples, samples_read);
		int64_t end = esp_timer_get_time();
		ESP_LOGI(TAG, "Wrote %d samples in %lld microseconds", samples_read, end - start);
	}
	// stop the input
	input->stop();
	// and finish the writing
	writer->finish();
	fclose(fp);
	delete writer;
	free(samples);
	ESP_LOGI(TAG, "Finished recording");
}



