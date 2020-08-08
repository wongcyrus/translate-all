sourcebucket=cyruswong-sam-repo
sam package --template-file template.yml --s3-bucket $sourcebucket --output-template-file packaged.yml
sam publish --template packaged.yml --region us-east-1