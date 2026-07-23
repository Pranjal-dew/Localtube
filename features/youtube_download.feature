Feature: YouTube Video Download and Metadata Extraction
  As a LocalTube user
  I want to paste YouTube URLs
  So that video files, metadata, thumbnails, and comments are fetched and stored locally

  Scenario Outline: Successfully downloading and ingesting YouTube videos
    Given the backend download service is ready
    When I submit the YouTube URL "<url>" for processing
    Then the download process should complete successfully
    And the video title "<expected_title_keyword>" should be extracted
    And the video file should exist on disk
    And the thumbnail image should be generated
    And top comments should be structured with timestamps

    Examples:
      | url                            | expected_title_keyword |
      | https://youtu.be/lYkR16aXHd8   | Infosys                |
      | https://youtu.be/B3P8bQZa3sA   | Zimbabwe               |
      | https://youtu.be/WOAavbTcp2A   | DCP Sandeep            |
      | https://youtu.be/16HMVsXXDV0   | Chilli                 |
      | https://youtu.be/e5zF0vaSxJg   | Markets Crash          |
